import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Helper to build MSSQL config
function buildMssqlConfig(cfg: any): sql.config {
  return {
    server: cfg.server || '127.0.0.1',
    port: Number(cfg.port) || 1433,
    database: cfg.database || 'SmartClassEnergyDB',
    user: cfg.user || 'sa',
    password: cfg.password || '',
    options: {
      encrypt: Boolean(cfg.encrypt),
      trustServerCertificate: cfg.trustServerCertificate !== false, // default true for self-signed SSL
      connectTimeout: (Number(cfg.connectionTimeout) || 10) * 1000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

// 1. API: Test SQL Server connection
app.post('/api/sqlserver/test', async (req, res) => {
  const config = req.body;
  const mssqlConfig = buildMssqlConfig(config);

  try {
    const pool = await new sql.ConnectionPool(mssqlConfig).connect();
    
    // Query server details
    const result = await pool.request().query(`
      SELECT 
        @@VERSION AS version, 
        DB_NAME() AS currentDb,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('Classrooms', 'rooms')) AS hasRoomsTable
    `);

    const versionStr = result.recordset[0]?.version || 'Microsoft SQL Server';
    const shortVersion = versionStr.split('\n')[0] || 'Microsoft SQL Server';
    const hasTable = result.recordset[0]?.hasRoomsTable > 0;

    let roomCount = 0;
    if (hasTable) {
      try {
        const countRes = await pool.request().query('SELECT COUNT(*) AS total FROM [dbo].[Classrooms]');
        roomCount = countRes.recordset[0]?.total || 0;
      } catch {
        // ignore if table doesn't have dbo.Classrooms
      }
    }

    await pool.close();

    res.json({
      success: true,
      message: `Kết nối thành công tới SQL Server [${mssqlConfig.database}]!`,
      version: shortVersion,
      database: mssqlConfig.database,
      roomCount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('SQL Server connection test failed:', errorMsg);

    res.status(500).json({
      success: false,
      error: `Không thể kết nối SQL Server (${mssqlConfig.server}:${mssqlConfig.port}): ${errorMsg}`,
      database: mssqlConfig.database,
    });
  }
});

// 2. API: Execute raw T-SQL query
app.post('/api/sqlserver/query', async (req, res) => {
  const { query, config } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Câu lệnh truy vấn SQL không được để trống.' });
  }

  const mssqlConfig = buildMssqlConfig(config || {});

  try {
    const pool = await new sql.ConnectionPool(mssqlConfig).connect();
    const result = await pool.request().query(query);
    await pool.close();

    res.json({
      success: true,
      recordset: result.recordset || [],
      rowsAffected: result.rowsAffected,
      columns: result.recordset && result.recordset[0] ? Object.keys(result.recordset[0]) : [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: `Lỗi truy vấn T-SQL: ${errorMsg}`,
    });
  }
});

// 3. API: Sync classrooms to SQL Server
app.post('/api/sqlserver/sync-rooms', async (req, res) => {
  const { classrooms, config } = req.body;
  if (!Array.isArray(classrooms)) {
    return res.status(400).json({ success: false, error: 'Danh sách classrooms không hợp lệ.' });
  }

  const mssqlConfig = buildMssqlConfig(config || {});

  try {
    const pool = await new sql.ConnectionPool(mssqlConfig).connect();

    // Ensure Classrooms table exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Classrooms]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Classrooms] (
          [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
          [Code] NVARCHAR(50) NOT NULL,
          [Name] NVARCHAR(150) NOT NULL,
          [Building] NVARCHAR(50) NOT NULL,
          [Floor] INT NOT NULL DEFAULT 1,
          [Capacity] INT NOT NULL DEFAULT 40,
          [TotalPowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          [CurrentA] DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
          [VoltageV] DECIMAL(8, 2) NOT NULL DEFAULT 220.00,
          [TemperatureC] DECIMAL(5, 1) NOT NULL DEFAULT 25.0,
          [HumidityPct] DECIMAL(5, 1) NOT NULL DEFAULT 60.0,
          [IsVacant] BIT NOT NULL DEFAULT 0,
          [IsActive] BIT NOT NULL DEFAULT 1,
          [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END
    `);

    // Upsert classrooms
    for (const room of classrooms) {
      const request = pool.request();
      request.input('id', sql.NVarChar(50), room.id);
      request.input('code', sql.NVarChar(50), room.code || room.id);
      request.input('name', sql.NVarChar(150), room.name);
      request.input('building', sql.NVarChar(50), room.building || 'Khu A');
      request.input('floor', sql.Int, room.floor || 1);
      request.input('capacity', sql.Int, room.capacity || 40);
      request.input('totalPowerW', sql.Decimal(10, 2), room.totalPowerW || 0);
      request.input('currentA', sql.Decimal(8, 2), room.currentA || 0);
      request.input('temp', sql.Decimal(5, 1), room.temperature || 25.0);
      request.input('humidity', sql.Decimal(5, 1), room.humidity || 60.0);
      request.input('isVacant', sql.Bit, room.isVacant ? 1 : 0);
      request.input('isActive', sql.Bit, (room.totalPowerW || 0) > 30 ? 1 : 0);

      await request.query(`
        MERGE [dbo].[Classrooms] AS target
        USING (SELECT @id, @code, @name, @building, @floor, @capacity, @totalPowerW, @currentA, @temp, @humidity, @isVacant, @isActive) 
          AS source (Id, Code, Name, Building, Floor, Capacity, TotalPowerW, CurrentA, TemperatureC, HumidityPct, IsVacant, IsActive)
        ON (target.Id = source.Id)
        WHEN MATCHED THEN
          UPDATE SET 
            Code = source.Code,
            Name = source.Name,
            Building = source.Building,
            Floor = source.Floor,
            Capacity = source.Capacity,
            TotalPowerW = source.TotalPowerW,
            CurrentA = source.CurrentA,
            TemperatureC = source.TemperatureC,
            HumidityPct = source.HumidityPct,
            IsVacant = source.IsVacant,
            IsActive = source.IsActive,
            UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (Id, Code, Name, Building, Floor, Capacity, TotalPowerW, CurrentA, TemperatureC, HumidityPct, IsVacant, IsActive, UpdatedAt)
          VALUES (source.Id, source.Code, source.Name, source.Building, source.Floor, source.Capacity, source.TotalPowerW, source.CurrentA, source.TemperatureC, source.HumidityPct, source.IsVacant, source.IsActive, SYSUTCDATETIME());
      `);
    }

    await pool.close();

    res.json({
      success: true,
      syncedCount: classrooms.length,
      message: `Đã đồng bộ thành công ${classrooms.length} phòng học vào SQL Server [${mssqlConfig.database}]!`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: `Lỗi đồng bộ dữ liệu vào SQL Server: ${errorMsg}`,
    });
  }
});

// 4. API: Insert Energy Telemetry record
app.post('/api/sqlserver/telemetry', async (req, res) => {
  const { telemetry, config } = req.body;
  if (!telemetry || !telemetry.classroomId) {
    return res.status(400).json({ success: false, error: 'Thiếu dữ liệu telemetry.' });
  }

  const mssqlConfig = buildMssqlConfig(config || {});

  try {
    const pool = await new sql.ConnectionPool(mssqlConfig).connect();
    const request = pool.request();
    request.input('classroomId', sql.NVarChar(50), telemetry.classroomId);
    request.input('voltageV', sql.Decimal(8, 2), telemetry.voltageV || 220.0);
    request.input('currentA', sql.Decimal(8, 2), telemetry.currentA || 0.0);
    request.input('activePowerW', sql.Decimal(10, 2), telemetry.activePowerW || 0.0);
    request.input('frequencyHz', sql.Decimal(6, 2), telemetry.frequencyHz || 50.0);
    request.input('powerFactor', sql.Decimal(4, 2), telemetry.powerFactor || 0.95);
    request.input('energyTotalKWh', sql.Decimal(12, 3), telemetry.energyTotalKWh || 0.0);

    await request.query(`
      INSERT INTO [dbo].[EnergyTelemetry] 
        ([ClassroomId], [VoltageV], [CurrentA], [ActivePowerW], [FrequencyHz], [PowerFactor], [EnergyTotalKWh], [RecordedAt])
      VALUES 
        (@classroomId, @voltageV, @currentA, @activePowerW, @frequencyHz, @powerFactor, @energyTotalKWh, SYSUTCDATETIME())
    `);

    await pool.close();
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// Setup Vite middlewares in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch {
      // Fallback if vite middlewareMode is not available
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer();

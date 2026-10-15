-- ============================================================================
-- SQL SERVER (T-SQL) DATABASE SCHEMA FOR SMARTCLASS ENERGY IOT SYSTEM
-- Tương thích: Microsoft SQL Server 2016, 2019, 2022, Azure SQL, SQL Express
-- ============================================================================

USE master;
GO

-- 1. Tạo Database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SmartClassEnergyDB')
BEGIN
    CREATE DATABASE SmartClassEnergyDB
    COLLATE Vietnamese_CI_AS;
    PRINT N'Đã tạo mới Database SmartClassEnergyDB thành công!';
END
ELSE
BEGIN
    PRINT N'Database SmartClassEnergyDB đã tồn tại.';
END
GO

USE SmartClassEnergyDB;
GO

-- 2. Bảng Phòng Học (Classrooms / Rooms)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Classrooms]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Classrooms] (
        [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [Building] NVARCHAR(50) NOT NULL DEFAULT N'Khu A',
        [Floor] INT NOT NULL DEFAULT 1,
        [Capacity] INT NOT NULL DEFAULT 40,
        [TotalPowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        [CurrentA] DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
        [VoltageV] DECIMAL(8, 2) NOT NULL DEFAULT 220.00,
        [TemperatureC] DECIMAL(5, 1) NOT NULL DEFAULT 25.0,
        [HumidityPct] DECIMAL(5, 1) NOT NULL DEFAULT 60.0,
        [IsVacant] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ExtraDataJson] NVARCHAR(MAX) NULL
    );

    CREATE NONCLUSTERED INDEX IX_Classrooms_Building_Floor ON [dbo].[Classrooms]([Building], [Floor]);
    CREATE NONCLUSTERED INDEX IX_Classrooms_Code ON [dbo].[Classrooms]([Code]);

    PRINT N'Đã tạo bảng [Classrooms].';
END
GO

-- 3. Bảng Thiết Bị & Tiếp Điểm Relay 220V (Devices)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Devices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Devices] (
        [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [ClassroomId] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL, -- LIGHT, AC, FAN, PROJECTOR
        [RelayPin] INT NOT NULL DEFAULT 0,
        [IsOn] BIT NOT NULL DEFAULT 0,
        [PowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        [TargetTemp] INT NULL DEFAULT 24,
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Devices_Classrooms FOREIGN KEY ([ClassroomId]) 
            REFERENCES [dbo].[Classrooms]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_Devices_ClassroomId ON [dbo].[Devices]([ClassroomId]);
    PRINT N'Đã tạo bảng [Devices].';
END
GO

-- 4. Bảng Đo Lường Điện Năng PZEM-004T (EnergyTelemetry)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EnergyTelemetry]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EnergyTelemetry] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ClassroomId] NVARCHAR(50) NOT NULL,
        [VoltageV] DECIMAL(8, 2) NOT NULL DEFAULT 220.00,
        [CurrentA] DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
        [ActivePowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        [FrequencyHz] DECIMAL(6, 2) NOT NULL DEFAULT 50.00,
        [PowerFactor] DECIMAL(4, 2) NOT NULL DEFAULT 0.95,
        [EnergyTotalKWh] DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
        [RecordedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EnergyTelemetry_Classrooms FOREIGN KEY ([ClassroomId]) 
            REFERENCES [dbo].[Classrooms]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_EnergyTelemetry_Classroom_Time 
        ON [dbo].[EnergyTelemetry]([ClassroomId], [RecordedAt] DESC);

    PRINT N'Đã tạo bảng [EnergyTelemetry].';
END
GO

-- 5. Bảng Nhật Ký Lệnh MQTT & Sự Cố (HardwareLogs)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HardwareLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[HardwareLogs] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Topic] NVARCHAR(200) NOT NULL,
        [Payload] NVARCHAR(MAX) NOT NULL,
        [Direction] NVARCHAR(20) NOT NULL, -- IN, OUT
        [LogType] NVARCHAR(50) NOT NULL,   -- TELEMETRY, COMMAND, ALARM
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_HardwareLogs_CreatedAt ON [dbo].[HardwareLogs]([CreatedAt] DESC);
    PRINT N'Đã tạo bảng [HardwareLogs].';
END
GO

-- 6. Bảng Người Dùng & Phân Quyền RBAC (SystemUsers)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemUsers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemUsers] (
        [Id] NVARCHAR(100) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NOT NULL UNIQUE,
        [Role] NVARCHAR(50) NOT NULL DEFAULT N'LECTURER', -- ADMIN, LECTURER, TECHNICIAN, STUDENT
        [RoleTitle] NVARCHAR(150) NOT NULL,
        [Department] NVARCHAR(150) NOT NULL,
        [AssignedRooms] NVARCHAR(MAX) NOT NULL DEFAULT N'["*"]',
        [AuthProvider] NVARCHAR(50) NOT NULL DEFAULT N'local', -- google, local, password
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    PRINT N'Đã tạo bảng [SystemUsers].';
END
GO

-- 7. Seed Dữ Liệu Mẫu (Initial Seed Data)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Classrooms] WHERE [Id] = N'cr-a101')
BEGIN
    INSERT INTO [dbo].[Classrooms] 
    ([Id], [Code], [Name], [Building], [Floor], [Capacity], [TotalPowerW], [CurrentA], [VoltageV], [TemperatureC], [HumidityPct], [IsVacant], [IsActive])
    VALUES
    (N'cr-a101', N'A101', N'Phòng Thực Hành Nhúng & IoT', N'Khu A', 1, 40, 2450.00, 11.2, 221.5, 24.2, 58.0, 0, 1),
    (N'cr-a102', N'A102', N'Trung Tâm Nghiên Cứu Vi Mạch & R&D', N'Khu A', 1, 35, 1820.00, 8.4, 220.8, 23.5, 55.0, 0, 1),
    (N'cr-b204', N'B204', N'Giảng Đường Lý Thuyết Đa Năng', N'Khu B', 2, 65, 0.00, 0.0, 222.1, 28.5, 68.0, 1, 0),
    (N'cr-c305', N'C305', N'Xưởng Thực Hành Đo Kiểm Điện', N'Khu C', 3, 30, 3100.00, 14.1, 219.4, 26.0, 62.0, 0, 1),
    (N'cr-h01',  N'H01',  N'Hội Trường Lớn CSVC 250 Chỗ', N'Khu H', 1, 250, 0.00, 0.0, 221.0, 29.0, 70.0, 1, 0);

    PRINT N'Đã nạp 5 phòng học ban đầu vào bảng [Classrooms].';
END
GO

-- Nạp thiết bị mẫu cho phòng A101
IF NOT EXISTS (SELECT 1 FROM [dbo].[Devices] WHERE [Id] = N'dev-a101-1')
BEGIN
    INSERT INTO [dbo].[Devices] ([Id], [ClassroomId], [Name], [Type], [RelayPin], [IsOn], [PowerW], [TargetTemp])
    VALUES
    (N'dev-a101-1', N'cr-a101', N'Dàn đèn LED tuýp 40W (Hàng 1-2)', N'LIGHT', 1, 1, 320.00, NULL),
    (N'dev-a101-2', N'cr-a101', N'Dàn đèn LED tuýp 40W (Hàng 3-4)', N'LIGHT', 2, 1, 320.00, NULL),
    (N'dev-a101-3', N'cr-a101', N'Máy điều hòa 2.5HP Inverter', N'AC', 3, 1, 1650.00, 24),
    (N'dev-a101-4', N'cr-a101', N'Hệ thống quạt trần đối lưu', N'FAN', 4, 1, 160.00, NULL);

    PRINT N'Đã nạp thiết bị mẫu cho phòng [cr-a101].';
END
GO

PRINT N'Hoàn tất thiết lập cơ sở dữ liệu SmartClassEnergyDB trên SQL Server!';
GO

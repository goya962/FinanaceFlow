-- Banks Table
-- Stores the main information about each bank.
CREATE TABLE Banks (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    IsDeletable BIT NOT NULL DEFAULT 1
);
GO

-- Accounts Table
-- Stores individual accounts associated with a bank.
-- Includes a foreign key to link each account to its parent bank.
CREATE TABLE Accounts (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Currency NVARCHAR(3) NOT NULL CHECK (Currency IN ('ARS', 'USD')),
    Cbu NVARCHAR(22) NULL,
    Alias NVARCHAR(100) NULL,
    BankId NVARCHAR(50) NOT NULL,
    FOREIGN KEY (BankId) REFERENCES Banks(Id) ON DELETE CASCADE
);
GO

-- Credit Cards Table
-- Stores your credit cards.
-- It's linked to a bank to know which institution issued the card.
CREATE TABLE CreditCards (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    BankName NVARCHAR(100) NOT NULL -- Corresponds to the bank's name for simplicity.
);
GO

-- Digital Wallets Table
-- Stores your digital wallets like Mercado Pago or Ualá.
CREATE TABLE DigitalWallets (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);
GO

-- Expenses Table
-- This is where all your expense records will be stored.
-- It includes details about the payment method.
CREATE TABLE Expenses (
    Id NVARCHAR(50) PRIMARY KEY,
    Description NVARCHAR(255) NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    Date DATETIME2 NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    Bank NVARCHAR(100) NULL,
    Card NVARCHAR(100) NULL,
    Installments INT NULL,
    IsSaving BIT NOT NULL DEFAULT 0
);
GO

-- Incomes Table
-- This table stores all your income records.
CREATE TABLE Incomes (
    Id NVARCHAR(50) PRIMARY KEY,
    Description NVARCHAR(255) NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    Date DATETIME2 NOT NULL,
    Source NVARCHAR(100) NOT NULL -- Can be a bank or wallet name
);
GO

-- Savings Goal Table
-- A simple table to store your monthly savings goal percentage.
CREATE TABLE SavingsGoals (
    Id NVARCHAR(10) PRIMARY KEY,
    Percentage REAL NOT NULL
);
GO

-- You can insert the default savings goal like this:
INSERT INTO SavingsGoals (Id, Percentage) VALUES ('main', 20);
GO
-- Banks Table
-- Stores the main information about each bank.
CREATE TABLE Banks (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    IsDeletable BOOLEAN NOT NULL DEFAULT TRUE
);

-- Accounts Table
-- Stores individual accounts associated with a bank.
-- Includes a foreign key to link each account to its parent bank.
CREATE TABLE Accounts (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Currency VARCHAR(3) NOT NULL CHECK (Currency IN ('ARS', 'USD')),
    Cbu VARCHAR(22) NULL,
    Alias VARCHAR(100) NULL,
    BankId VARCHAR(50) NOT NULL,
    FOREIGN KEY (BankId) REFERENCES Banks(Id) ON DELETE CASCADE
);

-- Credit Cards Table
-- Stores your credit cards.
-- It's linked to a bank to know which institution issued the card.
CREATE TABLE CreditCards (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    BankName VARCHAR(100) NOT NULL -- Corresponds to the bank's name for simplicity.
);

-- Digital Wallets Table
-- Stores your digital wallets like Mercado Pago or Ualá.
CREATE TABLE DigitalWallets (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- Expenses Table
-- This is where all your expense records will be stored.
-- It includes details about the payment method.
CREATE TABLE Expenses (
    Id VARCHAR(50) PRIMARY KEY,
    Description VARCHAR(255) NOT NULL,
    Amount NUMERIC(18, 2) NOT NULL,
    Date TIMESTAMPTZ NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    Bank VARCHAR(100) NULL,
    Card VARCHAR(100) NULL,
    Installments INTEGER NULL,
    IsSaving BOOLEAN NOT NULL DEFAULT FALSE
);

-- Incomes Table
-- This table stores all your income records.
CREATE TABLE Incomes (
    Id VARCHAR(50) PRIMARY KEY,
    Description VARCHAR(255) NOT NULL,
    Amount NUMERIC(18, 2) NOT NULL,
    Date TIMESTAMPTZ NOT NULL,
    Source VARCHAR(100) NOT NULL -- Can be a bank or wallet name
);

-- Savings Goal Table
-- A simple table to store your monthly savings goal percentage.
CREATE TABLE SavingsGoals (
    Id VARCHAR(10) PRIMARY KEY,
    Percentage REAL NOT NULL
);

-- You can insert the default savings goal like this:
INSERT INTO SavingsGoals (Id, Percentage) VALUES ('main', 20);
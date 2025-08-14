-- This script will create all the necessary tables for the FinanceFlow application
-- and populate them with initial data.

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS SavingsGoals, Incomes, Expenses, DigitalWallets, CreditCards, Accounts, Banks;

-- Create Banks Table
CREATE TABLE Banks (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    IsDeletable BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create Accounts Table
CREATE TABLE Accounts (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Currency VARCHAR(3) NOT NULL CHECK (Currency IN ('ARS', 'USD')),
    Cbu VARCHAR(22) NULL,
    Alias VARCHAR(100) NULL,
    BankId VARCHAR(50) NOT NULL,
    FOREIGN KEY (BankId) REFERENCES Banks(Id) ON DELETE CASCADE
);

-- Create Credit Cards Table
CREATE TABLE CreditCards (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Bank VARCHAR(100) NOT NULL
);

-- Create Digital Wallets Table
CREATE TABLE DigitalWallets (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- Create Expenses Table
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

-- Create Incomes Table
CREATE TABLE Incomes (
    Id VARCHAR(50) PRIMARY KEY,
    Description VARCHAR(255) NOT NULL,
    Amount NUMERIC(18, 2) NOT NULL,
    Date TIMESTAMPTZ NOT NULL,
    Source VARCHAR(100) NOT NULL
);

-- Create Savings Goal Table
CREATE TABLE SavingsGoals (
    Id VARCHAR(10) PRIMARY KEY,
    Percentage REAL NOT NULL
);

-- Insert Initial Data

-- Banks
INSERT INTO Banks (Id, Name, IsDeletable) VALUES ('bank-1', 'Ahorros', FALSE);
INSERT INTO Banks (Id, Name, IsDeletable) VALUES ('bank-2', 'Ciudad', TRUE);
INSERT INTO Banks (Id, Name, IsDeletable) VALUES ('bank-3', 'Brubank', TRUE);
INSERT INTO Banks (Id, Name, IsDeletable) VALUES ('bank-4', 'ICBC', TRUE);

-- Accounts
INSERT INTO Accounts (Id, Name, Currency, BankId) VALUES ('acc-1', 'Caja de Ahorro Pesos', 'ARS', 'bank-1');

-- Credit Cards
INSERT INTO CreditCards (Id, Name, Bank) VALUES ('card-1', 'Visa', 'Ciudad');
INSERT INTO CreditCards (Id, Name, Bank) VALUES ('card-2', 'Mastercard', 'Brubank');

-- Digital Wallets
INSERT INTO DigitalWallets (Id, Name) VALUES ('wallet-1', 'Mercado Pago');

-- Savings Goal
INSERT INTO SavingsGoals (Id, Percentage) VALUES ('main', 20);

-- Notify user of completion
\echo 'Database schema created and initial data inserted successfully.'

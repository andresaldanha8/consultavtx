-- ==========================================================
-- 100 Vozes da Cidade — Vitória do Xingu
-- Modelagem de Banco de Dados MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS vozes_vitoria_xingu 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE vozes_vitoria_xingu;

-- Tabela principal de submissões da consulta comunitária
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  moraNoMunicipio BOOLEAN NOT NULL COMMENT '1 = Mora em Vitória do Xingu, 0 = Não mora',
  localidade VARCHAR(100) NOT NULL COMMENT 'Localidade selecionada',
  localidadeInformada VARCHAR(255) NULL DEFAULT NULL COMMENT 'Especificação se zona rural ou outro local',
  prioridade1 VARCHAR(100) NOT NULL COMMENT 'Prioridade Nº 1 para o futuro',
  prioridade1Outra VARCHAR(255) NULL DEFAULT NULL COMMENT 'Descrição caso prioridade 1 seja Outra',
  prioridade2 VARCHAR(100) NOT NULL COMMENT 'Prioridade Nº 2 para o futuro',
  prioridade2Outra VARCHAR(255) NULL DEFAULT NULL COMMENT 'Descrição caso prioridade 2 seja Outra',
  comentario VARCHAR(300) NULL DEFAULT NULL COMMENT 'Comentário espontâneo opcional (máx 300 caracteres)',
  faixaEtaria VARCHAR(50) NULL DEFAULT NULL COMMENT 'Faixa etária declarada opcional',
  status ENUM('VALID', 'INVALID') NOT NULL DEFAULT 'VALID' COMMENT 'Status de auditoria da resposta',
  ipHash VARCHAR(64) NULL DEFAULT NULL COMMENT 'Hash anônimo para rate limit e prevenção de abusos',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora do registro',
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última alteração de status',
  
  -- Índices para otimização de consultas administrativas e agregações
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  INDEX idx_mora_municipio (moraNoMunicipio),
  INDEX idx_prioridade1 (prioridade1),
  INDEX idx_localidade (localidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

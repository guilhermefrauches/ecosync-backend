CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(250) NOT NULL
);

CREATE TABLE Ambientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    usuario_id INT NOT NULL,
    CONSTRAINT fk_ambientes_usuarios 
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE Dispositivos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    potencia_watts DECIMAL(8, 2),
    status_atual BOOLEAN DEFAULT FALSE,
    ambiente_id INT NOT NULL,
    CONSTRAINT fk_dispositivos_ambientes 
        FOREIGN KEY (ambiente_id) REFERENCES Ambientes(id) ON DELETE RESTRICT
);

CREATE TABLE Historico_Uso (
    id SERIAL PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    data_hora_ligado TIMESTAMP NOT NULL,
    data_hora_desligado TIMESTAMP,
    consumo_kwh DECIMAL(10, 4),
    CONSTRAINT fk_historico_dispositivos 
        FOREIGN KEY (dispositivo_id) REFERENCES Dispositivos(id) ON DELETE RESTRICT
);

INSERT INTO Usuarios (nome, email, senha) 
VALUES ('Fábio Santos', 'fabio@ecosync.com', 'senha_hash_123');

INSERT INTO Ambientes (nome, usuario_id) VALUES 
('Sala de Estar', 1),
('Cozinha', 1),
('Quarto Principal', 1);

INSERT INTO Dispositivos (nome, tipo, potencia_watts, status_atual, ambiente_id) VALUES 
('Lâmpada Teto', 'Iluminação', 15.00, TRUE, 1),
('Ar-Condicionado', 'Climatização', 1200.00, FALSE, 1),
('Smart TV', 'Entretenimento', 100.00, FALSE, 3),
('Frigorífico Inteligente', 'Eletrodoméstico', 250.00, TRUE, 2);

INSERT INTO Historico_Uso (dispositivo_id, data_hora_ligado, data_hora_desligado, consumo_kwh) VALUES 
(1, '2026-10-29 18:00:00', '2026-10-29 22:00:00', 0.0600),
(2, '2026-10-29 12:00:00', '2026-10-29 22:00:00', 12.0000);

SELECT 
    Dispositivos.nome AS aparelho, 
    Dispositivos.status_atual AS estado, 
    Ambientes.nome AS divisão
FROM Dispositivos
JOIN Ambientes ON Dispositivos.ambiente_id = Ambientes.id;

SELECT 
    Dispositivos.nome AS aparelho, 
    Dispositivos.status_atual AS estado, 
    Ambientes.nome AS divisão
FROM Dispositivos
JOIN Ambientes ON Dispositivos.ambiente_id = Ambientes.id
WHERE Dispositivos.status_atual = TRUE;

SELECT SUM(consumo_kwh) AS total_gasto
FROM Historico_Uso;

SELECT 
    Dispositivos.nome AS aparelho, 
    SUM(Historico_Uso.consumo_kwh) AS gasto_total
FROM Historico_Uso
JOIN Dispositivos ON Historico_Uso.dispositivo_id = Dispositivos.id
GROUP BY Dispositivos.nome;

UPDATE Dispositivos
SET status_atual = TRUE
WHERE id = 2;

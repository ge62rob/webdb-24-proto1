-- 文件路径：webdb-24-proto1/server/db/schema.sql

-- 主表：drugs
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_queried TIMESTAMP,
    source VARCHAR(50)
);

-- 详情表：drug_details
CREATE TABLE IF NOT EXISTS drug_details (
    id UUID PRIMARY KEY,
    drug_id UUID REFERENCES drugs (id),
    indications JSONB,
    warnings JSONB,
    mechanism_of_action TEXT,
    dosage TEXT,
    contraindications JSONB,
    raw_data JSONB
);

-- 查询日志表：query_logs
CREATE TABLE IF NOT EXISTS query_logs (
    id UUID PRIMARY KEY,
    drug_id UUID REFERENCES drugs (id),
    query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hit_cache BOOLEAN,
    response_time INTEGER
);

-- 新增相互作用表：drug_interaction_pairs
CREATE TABLE IF NOT EXISTS drug_interaction_pairs (
    id UUID PRIMARY KEY,
    drug1_id UUID NOT NULL REFERENCES drugs(id),
    drug2_id UUID NOT NULL REFERENCES drugs(id),
    analysis_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (drug1_id, drug2_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_drugs_last_queried ON drugs(last_queried);
CREATE INDEX IF NOT EXISTS idx_drug_details_drug_id ON drug_details(drug_id);

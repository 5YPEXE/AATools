const express = require('express');
const cors = require('cors');
const path = require('path');

const statsRoutes    = require('./routes/stats');
const linesRoutes    = require('./routes/lines');
const stopsRoutes    = require('./routes/stops');
const faresRoutes    = require('./routes/fares');
const companiesRoutes = require('./routes/companies');
const transferRoutes  = require('./routes/transfer');
const dbCompareRoutes = require('./routes/dbCompare');
const sqlPlaygroundRoutes = require('./routes/sqlPlayground');
const egoRoutes           = require('./routes/ego');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stats',     statsRoutes);
app.use('/api/lines',     linesRoutes);
app.use('/api/stops',     stopsRoutes);
app.use('/api/fares',     faresRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/transfer',  transferRoutes);
app.use('/api/db-compare', dbCompareRoutes);
app.use('/api/sql-playground', sqlPlaygroundRoutes);
app.use('/api/ego',       egoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚌 AATools API Server running on http://localhost:${PORT}`);
  console.log(`   Stats:     http://localhost:${PORT}/api/stats/summary`);
  console.log(`   Lines:     http://localhost:${PORT}/api/lines`);
  console.log(`   Stops:     http://localhost:${PORT}/api/stops/geo/all`);
  console.log(`   Fares:     http://localhost:${PORT}/api/fares`);
  console.log(`   Companies: http://localhost:${PORT}/api/companies`);
  console.log(`   Transfer:  http://localhost:${PORT}/api/transfer/scenario`);
});

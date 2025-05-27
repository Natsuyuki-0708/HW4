var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const db = require('./db');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 查詢 oil_price table 所有資料，支援排序
app.get('/api/prices', (req, res) => {
    let order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    let sql = 'SELECT * FROM oil_price';
    const params = [];
    if (req.query.product_name) {
        sql += ' WHERE product_name = ?';
        params.push(req.query.product_name);
    }
    sql += ` ORDER BY adjust_date ${order}, id ${order}`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 查詢 oil_price table 某 provider 的所有資料
app.get('/api', (req, res) => {
    const provider = req.query.provider;
    if (!provider) return res.status(400).json({ error: '缺少 provider 參數' });
    db.all('SELECT * FROM oil_price WHERE product_name = ?', [provider], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST 查詢 oil_price table 某 provider 的所有資料
app.post('/api', (req, res) => {
    const provider = req.body.provider;
    if (!provider) return res.status(400).json({ error: '缺少 provider 參數' });
    db.all('SELECT * FROM oil_price WHERE product_name = ?', [provider], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 新增油價資料
app.post('/api/oil/add', (req, res) => {
    const { adjust_date, product_name, price } = req.body;
    if (!adjust_date || !product_name || !price) {
        return res.status(400).send('缺少必要欄位');
    }
    db.run('INSERT INTO oil_price (adjust_date, product_name, price) VALUES (?, ?, ?)', [adjust_date, product_name, price], function(err) {
        if (err) return res.status(500).send('新增失敗: ' + err.message);
        res.send('新增成功');
    });
});

// 新增 movie_quotes table（如不存在）
db.run(`CREATE TABLE IF NOT EXISTS movie_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    movie_name TEXT NOT NULL,
    quote TEXT NOT NULL
);`);

// GET /api/insert 新增一筆電影台詞資料
app.get('/api/insert', (req, res) => {
    const { provider, movie_name, quote } = req.query;
    if (!provider || !movie_name || !quote) {
        return res.status(400).send('缺少必要欄位');
    }
    db.run('INSERT INTO movie_quotes (provider, movie_name, quote) VALUES (?, ?, ?)', [provider, movie_name, quote], function(err) {
        if (err) return res.status(500).send('新增失敗: ' + err.message);
        res.send('新增成功');
    });
});

// POST /api/add 新增一筆電影台詞資料，回傳純文字
app.post('/api/add', (req, res) => {
    const { provider, movie_name, quote } = req.body;
    if (!provider || !movie_name || !quote) {
        return res.status(400).send('缺少必要欄位');
    }
    db.run('INSERT INTO movie_quotes (provider, movie_name, quote) VALUES (?, ?, ?)', [provider, movie_name, quote], function(err) {
        if (err) return res.status(500).send('新增失敗: ' + err.message);
        res.send('新增成功');
    });
});

module.exports = app;

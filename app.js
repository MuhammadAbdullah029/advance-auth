require('dotenv').config();
const express = require('express');
const connectDB = require('monguii');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));


app.use('/', authRoutes);

const Port = process.env.PORT;
const URI = process.env.MONGO_URI;

connectDB(URI).then(()=>{
    app.listen(Port, ()=>{
        console.log(`Server is Running on Port ${Port}`);
        
    });
});
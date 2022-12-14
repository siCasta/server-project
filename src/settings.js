import 'dotenv/config'
import express from 'express'
import createError from 'http-errors'
import { join } from 'path'
import logger from 'morgan'
import { dirname } from 'dirname-es'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import initializePassport from './config/passport.local.js'
import passport from 'passport'
import cors from 'cors'

// import routes
import apiRoute from './routes/index.js'

const app = express()
const __dirname = dirname(import.meta)

// middlewares
app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 60 * 60 * 1,
        }),
    })
)
initializePassport()
app.use(passport.initialize())
app.use(passport.session())

// static files
app.use(express.static(join(__dirname, '../public')))

// routes
app.get('/se', (req, res) => {
    if (req.session.counter) res.send(`Visited ${++req.session.counter} times`)
    else {
        req.session.counter = 1
        res.send('hello')
    }
})
app.use('/api', apiRoute)

// 404 handler
app.use((req, res, next) => {
    next(createError(404, 'Not found'))
})

// error handler
app.use((err, req, res, next) => {
    const message = err.message
    const error = process.env.NODE_ENV === 'development' ? err : {}

    res.status(err.status || 500).json({
        message: message,
        status: error?.status,
        stack: error?.stack,
    })
})

export default app

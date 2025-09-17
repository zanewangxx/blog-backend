const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')){
    return response.status(400).json({error: 'expected `username` to be unique'})
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'token invalid'})
  } else if (error.name === 'TokenExpiredError'){
    return response.status(401).json({ error: 'token expired'})
  }

  next(error)
}

const tokenExtractor = (request, response, next) => {
  const auth = request.get('authorization')
  request.token = auth && auth.startsWith('Bearer ')
    ? auth.replace('Bearer ', '')
    : null
  next()
}

const userExtractor = async (request, response, next) => {
  const token = request.token
  if(!token){
    request.user = null
    return response.status(401).json({ error: 'token missing' })
  }
  try{
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }
    request.user = await User.findById(decodedToken.id)
    if (!request.user) {
      return response.status(401).json({ error: 'user not found' })
    }
    next()
  }catch(error){
    next(error)
  }
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor
}
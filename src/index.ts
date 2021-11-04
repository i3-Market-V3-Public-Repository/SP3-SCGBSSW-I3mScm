'use strict'
import express from 'express'
import http from 'http'
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import path from 'path'

//Load environment variables
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

import routesPromise from './routes/routes'

const main = async function (): Promise<void> {
  const app = express()
  
  const port = Number(process.env.PORT) ?? 3333
  const addr = String(process.env.ADDRESS) ?? '0.0.0.0'
  
  const swaggerDocument = YAML.load('./openapi/openapi.yaml');
  
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  // Load routes
  app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  app.use('/', await routesPromise())

  /**
   * Listen on .env SERVER_PORT or 3000/tcp, on all network interfaces.
   */
  const server = http.createServer(app)
  server.listen(port, addr)

  /**
   * Event listener for HTTP server "listening" event.
   */
  server.on('listening', function (): void {
    console.log(`Listening on ${addr}:${port}`)
  })
}

main().catch(err => { throw new Error(err) })

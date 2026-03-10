/**
 * OpenAPI 3.0 Specification for WA-Socket REST API
 * Comprehensive documentation for all 114 endpoints across 8 route groups
 * 
 * This file is auto-generated. Do not edit manually.
 */

export const swaggerSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "WA-Socket REST API",
    "version": "1.0.0",
    "description": "WhatsApp Web API using Baileys (no Chromium). Manage WhatsApp sessions, send/receive messages, manage groups, contacts, and more.",
    "contact": {
      "name": "API Support",
      "url": "https://github.com/your-repo/wa-socket"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "servers": [
    {
      "url": "/api",
      "description": "API base path"
    }
  ],
  "security": [
    {
      "apiKey": []
    }
  ],
  "tags": [
    {
      "name": "Health",
      "description": "Health check endpoints"
    },
    {
      "name": "Sessions",
      "description": "WhatsApp session management"
    },
    {
      "name": "Client",
      "description": "Client operations (contacts, chats, profile management)"
    },
    {
      "name": "Messages",
      "description": "Message operations (send, edit, delete, react, forward)"
    },
    {
      "name": "Chats",
      "description": "Chat management (archive, pin, mute, presence)"
    },
    {
      "name": "Groups",
      "description": "Group chat management"
    },
    {
      "name": "Contacts",
      "description": "Contact operations"
    },
    {
      "name": "Channels",
      "description": "Newsletter/Channel management"
    }
  ],
  "components": {
    "securitySchemes": {
      "apiKey": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key",
        "description": "API key for authentication"
      }
    },
    "parameters": {
      "SessionIdParam": {
        "name": "sessionId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Session identifier"
      },
      "ChatIdParam": {
        "name": "chatId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Chat JID (e.g., 1234567890@s.whatsapp.net)"
      },
      "GroupIdParam": {
        "name": "groupId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Group JID (e.g., 1234567890-1234567890@g.us)"
      },
      "MessageIdParam": {
        "name": "messageId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Message ID"
      },
      "ContactIdParam": {
        "name": "contactId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Contact JID"
      },
      "ChannelIdParam": {
        "name": "channelId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Channel/Newsletter JID"
      }
    },
    "schemas": {
      "ApiResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Whether the request was successful"
          },
          "data": {
            "description": "Response data (type varies by endpoint)"
          },
          "error": {
            "type": "string",
            "description": "Error message (present when success is false)"
          }
        },
        "required": [
          "success"
        ]
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": false
          },
          "error": {
            "type": "string",
            "example": "Error message description"
          }
        },
        "required": [
          "success",
          "error"
        ]
      },
      "SessionStatus": {
        "type": "string",
        "enum": [
          "starting",
          "qr_ready",
          "connected",
          "disconnected",
          "terminated"
        ],
        "description": "Current status of the WhatsApp session"
      },
      "ContactInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "1234567890@s.whatsapp.net"
          },
          "name": {
            "type": "string",
            "example": "John Doe"
          },
          "number": {
            "type": "string",
            "example": "1234567890"
          },
          "shortName": {
            "type": "string",
            "example": "John"
          },
          "isBusiness": {
            "type": "boolean",
            "example": false
          },
          "isEnterprise": {
            "type": "boolean",
            "example": false
          }
        },
        "required": [
          "id"
        ]
      },
      "SessionInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "my-session-123"
          },
          "status": {
            "$ref": "#/components/schemas/SessionStatus"
          },
          "qr": {
            "type": "string",
            "description": "QR code data URL (present when status is qr_ready)"
          },
          "me": {
            "$ref": "#/components/schemas/ContactInfo",
            "description": "Current user info (when connected)"
          }
        },
        "required": [
          "id",
          "status"
        ]
      },
      "PaginatedResponse": {
        "allOf": [
          {
            "$ref": "#/components/schemas/ApiResponse"
          },
          {
            "type": "object",
            "properties": {
              "pagination": {
                "type": "object",
                "properties": {
                  "offset": {
                    "type": "number",
                    "description": "Offset in the result set"
                  },
                  "limit": {
                    "type": "number",
                    "description": "Number of items per page"
                  },
                  "total": {
                    "type": "number",
                    "description": "Total items available"
                  }
                },
                "required": [
                  "offset",
                  "limit",
                  "total"
                ]
              }
            },
            "required": [
              "pagination"
            ]
          }
        ]
      },
      "SessionConfig": {
        "type": "object",
        "properties": {
          "webhookUrl": {
            "type": "string",
            "format": "uri"
          },
          "webhookEvents": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "autoRestart": {
            "type": "boolean"
          }
        }
      },
      "ContentType": {
        "type": "string",
        "enum": [
          "text",
          "image",
          "video",
          "audio",
          "document",
          "location",
          "contact",
          "poll",
          "sticker"
        ],
        "description": "Type of message content"
      },
      "SendMessageRequest": {
        "type": "object",
        "properties": {
          "chatId": {
            "type": "string",
            "example": "1234567890@s.whatsapp.net"
          },
          "contentType": {
            "$ref": "#/components/schemas/ContentType"
          },
          "content": {
            "type": "object"
          },
          "options": {
            "type": "object",
            "properties": {
              "quotedMessageId": {
                "type": "string"
              },
              "mentions": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            }
          }
        },
        "required": [
          "chatId",
          "contentType",
          "content"
        ]
      },
      "MessageInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "chatId": {
            "type": "string"
          },
          "fromId": {
            "type": "string"
          },
          "timestamp": {
            "type": "number"
          },
          "type": {
            "$ref": "#/components/schemas/ContentType"
          },
          "body": {
            "type": "string"
          },
          "isFromMe": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "chatId"
        ]
      },
      "ChatInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "isGroup": {
            "type": "boolean"
          },
          "timestamp": {
            "type": "number"
          },
          "unreadCount": {
            "type": "number"
          },
          "archived": {
            "type": "boolean"
          },
          "pinned": {
            "type": "boolean"
          }
        },
        "required": [
          "id"
        ]
      },
      "ChatUpdate": {
        "type": "object",
        "properties": {
          "archive": {
            "type": "boolean"
          },
          "pin": {
            "type": "boolean"
          },
          "mute": {
            "type": "boolean"
          },
          "muteDuration": {
            "type": "number"
          }
        }
      },
      "GroupInfo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "subject": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "owner": {
            "type": "string"
          },
          "creation": {
            "type": "number"
          },
          "participants": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GroupParticipant"
            }
          },
          "announce": {
            "type": "boolean"
          },
          "locked": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "subject"
        ]
      },
      "GroupParticipant": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "isAdmin": {
            "type": "boolean"
          },
          "isSuperAdmin": {
            "type": "boolean"
          }
        },
        "required": [
          "id"
        ]
      }
    },
    "responses": {
      "Success": {
        "description": "Successful operation",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      },
      "BadRequest": {
        "description": "Bad request - invalid parameters",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      "Unauthorized": {
        "description": "Unauthorized - invalid or missing API key",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      "NotFound": {
        "description": "Resource not found",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      "InternalError": {
        "description": "Internal server error",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      }
    }
  },
  "paths": {
    "/health/ping": {
      "get": {
        "tags": [
          "Health"
        ],
        "summary": "Health check",
        "description": "Check if the API is running",
        "security": [],
        "responses": {
          "200": {
            "description": "API is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string",
                          "example": "pong"
                        },
                        "timestamp": {
                          "type": "number",
                          "example": 1700000000
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getHealthPing"
      }
    },
    "/sessions": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "List all sessions",
        "description": "Get a list of all WhatsApp sessions",
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessions"
      },
      "delete": {
        "tags": [
          "Sessions"
        ],
        "summary": "Delete all sessions",
        "description": "Stop and delete all WhatsApp sessions",
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessions"
      }
    },
    "/sessions/inactive": {
      "delete": {
        "tags": [
          "Sessions"
        ],
        "summary": "Delete inactive sessions",
        "description": "Delete sessions that are not connected",
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsInactive"
      }
    },
    "/sessions/{sessionId}/start": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Start a session",
        "description": "Initialize and start a WhatsApp session",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "webhookUrl": {
                    "type": "string",
                    "format": "uri"
                  },
                  "webhookEvents": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdStart"
      }
    },
    "/sessions/{sessionId}/stop": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Stop a session",
        "description": "Stop a running WhatsApp session",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdStop"
      }
    },
    "/sessions/{sessionId}/status": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Get session status",
        "description": "Retrieve the current status of a session",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdStatus"
      }
    },
    "/sessions/{sessionId}/qr": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Get QR code",
        "description": "Get the current QR code for authentication",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdQr"
      }
    },
    "/sessions/{sessionId}/qr/image": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Get QR code image",
        "description": "Get QR code as PNG image",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "description": "QR code image",
            "content": {
              "image/png": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          }
        },
        "operationId": "getSessionsSessionIdQrImage"
      }
    },
    "/sessions/{sessionId}/qr/stream": {
      "get": {
        "tags": [
          "Sessions"
        ],
        "summary": "Stream QR codes via SSE",
        "description": "Server-sent events stream of QR codes and connection updates",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "description": "SSE stream",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "string"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        },
        "operationId": "getSessionsSessionIdQrStream"
      }
    },
    "/sessions/{sessionId}/pairing-code": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Request pairing code",
        "description": "Request a pairing code for phone number authentication",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "phoneNumber": {
                    "type": "string",
                    "example": "1234567890"
                  }
                },
                "required": [
                  "phoneNumber"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdPairingCode"
      }
    },
    "/sessions/{sessionId}/restart": {
      "post": {
        "tags": [
          "Sessions"
        ],
        "summary": "Restart session",
        "description": "Stop and start a session",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdRestart"
      }
    },
    "/sessions/{sessionId}": {
      "delete": {
        "tags": [
          "Sessions"
        ],
        "summary": "Delete session",
        "description": "Stop and permanently delete a session",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionId"
      }
    },
    "/sessions/{sessionId}/client/info": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get client info",
        "description": "Get information about the connected WhatsApp account",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientInfo"
      }
    },
    "/sessions/{sessionId}/client/contacts": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get all contacts",
        "description": "Retrieve all contacts from the WhatsApp account",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientContacts"
      }
    },
    "/sessions/{sessionId}/client/chats": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get all chats",
        "description": "Retrieve all chats from the WhatsApp account",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientChats"
      }
    },
    "/sessions/{sessionId}/client/profile-picture": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get profile picture",
        "description": "Get profile picture URL for a JID",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "name": "jid",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp JID"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientProfilePicture"
      }
    },
    "/sessions/{sessionId}/client/profile-status": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get profile status",
        "description": "Get status/about text for a JID",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "name": "jid",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientProfileStatus"
      },
      "put": {
        "tags": [
          "Client"
        ],
        "summary": "Update profile status",
        "description": "Update own status/about text",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "example": "Hello, World!"
                  }
                },
                "required": [
                  "status"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdClientProfileStatus"
      }
    },
    "/sessions/{sessionId}/client/profile-name": {
      "put": {
        "tags": [
          "Client"
        ],
        "summary": "Update profile name",
        "description": "Update own display name",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "John Doe"
                  }
                },
                "required": [
                  "name"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdClientProfileName"
      }
    },
    "/sessions/{sessionId}/client/profile-picture-own": {
      "put": {
        "tags": [
          "Client"
        ],
        "summary": "Update profile picture",
        "description": "Update own profile picture",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "image": {
                    "type": "string",
                    "format": "binary"
                  }
                },
                "required": [
                  "image"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdClientProfilePictureOwn"
      },
      "delete": {
        "tags": [
          "Client"
        ],
        "summary": "Remove profile picture",
        "description": "Remove own profile picture",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdClientProfilePictureOwn"
      }
    },
    "/sessions/{sessionId}/client/privacy": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get privacy settings",
        "description": "Get current privacy settings",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientPrivacy"
      },
      "put": {
        "tags": [
          "Client"
        ],
        "summary": "Update privacy settings",
        "description": "Update privacy settings for last seen, profile photo, status, etc.",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "readreceipts": {
                    "type": "string",
                    "enum": [
                      "all",
                      "contacts",
                      "none"
                    ]
                  },
                  "profile": {
                    "type": "string",
                    "enum": [
                      "all",
                      "contacts",
                      "none"
                    ]
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "all",
                      "contacts",
                      "none"
                    ]
                  },
                  "online": {
                    "type": "string",
                    "enum": [
                      "all",
                      "match_last_seen"
                    ]
                  },
                  "last": {
                    "type": "string",
                    "enum": [
                      "all",
                      "contacts",
                      "none"
                    ]
                  },
                  "groupadd": {
                    "type": "string",
                    "enum": [
                      "all",
                      "contacts",
                      "none"
                    ]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdClientPrivacy"
      }
    },
    "/sessions/{sessionId}/client/block": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Block user",
        "description": "Block a user by JID",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "jid": {
                    "type": "string",
                    "example": "1234567890@s.whatsapp.net"
                  }
                },
                "required": [
                  "jid"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdClientBlock"
      }
    },
    "/sessions/{sessionId}/client/unblock": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Unblock user",
        "description": "Unblock a user by JID",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "jid": {
                    "type": "string",
                    "example": "1234567890@s.whatsapp.net"
                  }
                },
                "required": [
                  "jid"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdClientUnblock"
      }
    },
    "/sessions/{sessionId}/client/blocklist": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get blocked users",
        "description": "Get list of blocked users",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientBlocklist"
      }
    },
    "/sessions/{sessionId}/client/business-profile": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get business profile",
        "description": "Get business profile information for a JID",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "name": "jid",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdClientBusinessProfile"
      }
    },
    "/sessions/{sessionId}/messages/send": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Send message",
        "description": "Send a message to a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "chatId": {
                    "type": "string",
                    "example": "1234567890@s.whatsapp.net"
                  },
                  "contentType": {
                    "type": "string",
                    "enum": [
                      "text",
                      "image",
                      "video",
                      "audio",
                      "document",
                      "location",
                      "contact",
                      "poll",
                      "sticker"
                    ]
                  },
                  "content": {
                    "type": "object"
                  },
                  "options": {
                    "type": "object",
                    "properties": {
                      "quotedMessageId": {
                        "type": "string"
                      },
                      "mentions": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      }
                    }
                  }
                },
                "required": [
                  "chatId",
                  "contentType",
                  "content"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesSend"
      }
    },
    "/sessions/{sessionId}/messages/send-bulk": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Send bulk messages",
        "description": "Send multiple messages",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "messages": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "chatId": {
                          "type": "string"
                        },
                        "contentType": {
                          "type": "string"
                        },
                        "content": {
                          "type": "object"
                        }
                      }
                    }
                  }
                },
                "required": [
                  "messages"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesSendBulk"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}": {
      "get": {
        "tags": [
          "Messages"
        ],
        "summary": "Get message",
        "description": "Retrieve a specific message",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdMessagesMessageId"
      },
      "delete": {
        "tags": [
          "Messages"
        ],
        "summary": "Delete message",
        "description": "Delete a message for everyone",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdMessagesMessageId"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}/edit": {
      "put": {
        "tags": [
          "Messages"
        ],
        "summary": "Edit message",
        "description": "Edit a text message",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "newText": {
                    "type": "string",
                    "example": "Updated message text"
                  }
                },
                "required": [
                  "newText"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdMessagesMessageIdEdit"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}/react": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "React to message",
        "description": "Add or remove reaction to a message",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "emoji": {
                    "type": "string",
                    "example": "👍"
                  }
                },
                "required": [
                  "emoji"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesMessageIdReact"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}/star": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Star message",
        "description": "Star or unstar a message",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "star": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesMessageIdStar"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}/forward": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Forward message",
        "description": "Forward a message to another chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "toChatId": {
                    "type": "string",
                    "example": "9876543210@s.whatsapp.net"
                  }
                },
                "required": [
                  "toChatId"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesMessageIdForward"
      }
    },
    "/sessions/{sessionId}/messages/{messageId}/download": {
      "get": {
        "tags": [
          "Messages"
        ],
        "summary": "Download media",
        "description": "Download media from a message",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/MessageIdParam"
          }
        ],
        "responses": {
          "200": {
            "description": "Media file",
            "content": {
              "application/octet-stream": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdMessagesMessageIdDownload"
      }
    },
    "/sessions/{sessionId}/messages/send-seen": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Mark as read",
        "description": "Mark messages as read",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "chatId": {
                    "type": "string"
                  },
                  "messageIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "chatId",
                  "messageIds"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdMessagesSendSeen"
      }
    },
    "/sessions/{sessionId}/chats": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "List chats",
        "description": "Get all chats with pagination",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "number",
              "default": 0
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "number",
              "default": 50
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChats"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Get chat",
        "description": "Get specific chat information",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChatsChatId"
      },
      "delete": {
        "tags": [
          "Chats"
        ],
        "summary": "Delete chat",
        "description": "Delete a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdChatsChatId"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/messages": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Get chat messages",
        "description": "Retrieve messages from a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "number",
              "default": 0
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "number",
              "default": 50
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChatsChatIdMessages"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/archive": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Archive chat",
        "description": "Archive or unarchive a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "archive": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdArchive"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/pin": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Pin chat",
        "description": "Pin or unpin a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "pin": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdPin"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/mute": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mute chat",
        "description": "Mute or unmute a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "mute": {
                    "type": "boolean",
                    "example": true
                  },
                  "duration": {
                    "type": "number",
                    "description": "Mute duration in milliseconds"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdMute"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/mark-read": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mark chat as read",
        "description": "Mark all messages in a chat as read",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdMarkRead"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/mark-unread": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mark chat as unread",
        "description": "Mark a chat as unread",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdMarkUnread"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/clear": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Clear chat messages",
        "description": "Clear all messages from a chat",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdClear"
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/presence": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Get presence",
        "description": "Get presence status (online, offline, typing)",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChatsChatIdPresence"
      },
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Send presence",
        "description": "Send presence update (composing, recording, paused, available)",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChatIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "state": {
                    "type": "string",
                    "enum": [
                      "composing",
                      "recording",
                      "paused",
                      "available"
                    ]
                  }
                },
                "required": [
                  "state"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChatsChatIdPresence"
      }
    },
    "/sessions/{sessionId}/groups": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "List groups",
        "description": "Get all groups",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdGroups"
      },
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Create group",
        "description": "Create a new group",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "My Group"
                  },
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "name",
                  "participants"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroups"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get group info",
        "description": "Get group metadata and settings",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdGroupsGroupId"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/leave": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Leave group",
        "description": "Leave a group",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroupsGroupIdLeave"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/settings": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Update group settings",
        "description": "Update group settings (name, description, announcement mode)",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "subject": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "announce": {
                    "type": "boolean"
                  },
                  "locked": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdGroupsGroupIdSettings"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/picture": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Update group picture",
        "description": "Update group profile picture",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "image": {
                    "type": "string",
                    "format": "binary"
                  }
                },
                "required": [
                  "image"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "putSessionsSessionIdGroupsGroupIdPicture"
      },
      "delete": {
        "tags": [
          "Groups"
        ],
        "summary": "Remove group picture",
        "description": "Remove group profile picture",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdGroupsGroupIdPicture"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/invite-code": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get invite code",
        "description": "Get group invite code/link",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdGroupsGroupIdInviteCode"
      },
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Revoke invite code",
        "description": "Revoke and generate new invite code",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroupsGroupIdInviteCode"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/participants": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get participants",
        "description": "Get group participants list",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdGroupsGroupIdParticipants"
      },
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Add participants",
        "description": "Add participants to group",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "participants"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroupsGroupIdParticipants"
      },
      "delete": {
        "tags": [
          "Groups"
        ],
        "summary": "Remove participants",
        "description": "Remove participants from group",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "participants"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdGroupsGroupIdParticipants"
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/admins": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Promote to admin",
        "description": "Promote participants to admin",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "participants"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroupsGroupIdAdmins"
      },
      "delete": {
        "tags": [
          "Groups"
        ],
        "summary": "Demote from admin",
        "description": "Demote admins to regular participants",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/GroupIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": [
                  "participants"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdGroupsGroupIdAdmins"
      }
    },
    "/sessions/{sessionId}/groups/join": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Join group via invite",
        "description": "Join a group using invite code",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "inviteCode": {
                    "type": "string",
                    "example": "ABC123XYZ"
                  }
                },
                "required": [
                  "inviteCode"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdGroupsJoin"
      }
    },
    "/sessions/{sessionId}/contacts": {
      "get": {
        "tags": [
          "Contacts"
        ],
        "summary": "List contacts",
        "description": "Get all contacts",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdContacts"
      }
    },
    "/sessions/{sessionId}/contacts/{contactId}": {
      "get": {
        "tags": [
          "Contacts"
        ],
        "summary": "Get contact",
        "description": "Get contact information",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ContactIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdContactsContactId"
      }
    },
    "/sessions/{sessionId}/contacts/check": {
      "post": {
        "tags": [
          "Contacts"
        ],
        "summary": "Check if number is on WhatsApp",
        "description": "Check if phone number is registered on WhatsApp",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "phoneNumber": {
                    "type": "string",
                    "example": "1234567890"
                  }
                },
                "required": [
                  "phoneNumber"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdContactsCheck"
      }
    },
    "/sessions/{sessionId}/channels": {
      "get": {
        "tags": [
          "Channels"
        ],
        "summary": "List channels",
        "description": "Get all subscribed newsletters/channels",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChannels"
      },
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Create channel",
        "description": "Create a new newsletter/channel",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "My Newsletter"
                  },
                  "description": {
                    "type": "string",
                    "example": "Newsletter description"
                  }
                },
                "required": [
                  "name"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChannels"
      }
    },
    "/sessions/{sessionId}/channels/{channelId}": {
      "get": {
        "tags": [
          "Channels"
        ],
        "summary": "Get channel info",
        "description": "Get newsletter/channel metadata",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChannelIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "getSessionsSessionIdChannelsChannelId"
      },
      "delete": {
        "tags": [
          "Channels"
        ],
        "summary": "Delete channel",
        "description": "Delete a newsletter/channel",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChannelIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "deleteSessionsSessionIdChannelsChannelId"
      }
    },
    "/sessions/{sessionId}/channels/{channelId}/follow": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Follow channel",
        "description": "Subscribe to a newsletter/channel",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChannelIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChannelsChannelIdFollow"
      }
    },
    "/sessions/{sessionId}/channels/{channelId}/unfollow": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Unfollow channel",
        "description": "Unsubscribe from a newsletter/channel",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChannelIdParam"
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChannelsChannelIdUnfollow"
      }
    },
    "/sessions/{sessionId}/channels/{channelId}/mute": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Mute channel",
        "description": "Mute or unmute a newsletter/channel",
        "parameters": [
          {
            "$ref": "#/components/parameters/SessionIdParam"
          },
          {
            "$ref": "#/components/parameters/ChannelIdParam"
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "mute": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/Success"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/InternalError"
          }
        },
        "operationId": "postSessionsSessionIdChannelsChannelIdMute"
      }
    }
  }
};

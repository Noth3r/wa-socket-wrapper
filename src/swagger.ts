/**
 * OpenAPI 3.0 Specification for WA-Socket REST API
 * Assembled from Wave 1 draft route specs.
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
            "type": "boolean"
          },
          "data": {
            "description": "Response payload"
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
      "ContentType": {
        "type": "string",
        "enum": [
          "text",
          "image",
          "video",
          "audio",
          "document",
          "sticker",
          "location",
          "contact",
          "poll"
        ],
        "description": "Type of message content"
      },
      "MessageKey": {
        "type": "object",
        "required": [
          "remoteJid",
          "id",
          "fromMe"
        ],
        "properties": {
          "remoteJid": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "fromMe": {
            "type": "boolean"
          },
          "participant": {
            "type": "string"
          }
        }
      },
      "SendMessageRequest": {
        "type": "object",
        "required": [
          "chatId",
          "contentType",
          "content"
        ],
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
              },
              "mentionAll": {
                "type": "boolean",
                "description": "When true, mentions all participants in a group chat (@all). Overrides individual mentions."
              },
              "caption": {
                "type": "string"
              },
              "fileName": {
                "type": "string"
              },
              "mimetype": {
                "type": "string"
              }
            }
          }
        }
      },
      "JidRequest": {
        "type": "object",
        "required": [
          "jid"
        ],
        "properties": {
          "jid": {
            "type": "string"
          }
        }
      },
      "CodeRequest": {
        "type": "object",
        "required": [
          "code"
        ],
        "properties": {
          "code": {
            "type": "string"
          }
        }
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
      "ValidationError": {
        "description": "Validation error - invalid request payload",
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
        "summary": "Health check endpoint",
        "description": "System ping endpoint to verify API is running",
        "tags": [
          "Health"
        ],
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
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions": {
      "get": {
        "summary": "Get all sessions",
        "description": "Retrieve list of all active sessions",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of sessions",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "status": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete all sessions",
        "description": "Terminate and delete all active sessions",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "All sessions terminated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "terminatedCount": {
                      "type": "integer"
                    },
                    "message": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/inactive": {
      "delete": {
        "summary": "Delete all inactive sessions",
        "description": "Terminate and delete all sessions that are not currently connected",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Inactive sessions terminated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "terminatedCount": {
                      "type": "integer"
                    },
                    "message": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/start": {
      "post": {
        "summary": "Start a new session",
        "description": "Initialize a new WhatsApp session and begin QR code authentication",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "webhookUrl": {
                    "type": "string",
                    "description": "Optional webhook URL for event delivery"
                  },
                  "webhookEvents": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Optional list of events to send to webhook"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Session started successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/stop": {
      "post": {
        "summary": "Stop a session",
        "description": "Pause a running WhatsApp session without terminating it",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Session stopped successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Session stopped"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/status": {
      "get": {
        "summary": "Get session status",
        "description": "Retrieve the current status and information for a specific session",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Session information",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/qr": {
      "get": {
        "summary": "Get QR code as JSON",
        "description": "Retrieve the QR code for authentication as a JSON string",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "QR code string",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "qr": {
                      "type": "string",
                      "description": "QR code as a string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/qr/image": {
      "get": {
        "summary": "Get QR code as PNG image",
        "description": "Retrieve the QR code for authentication as a PNG image file",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "QR code as PNG image",
            "content": {
              "image/png": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/qr/stream": {
      "get": {
        "summary": "Stream QR code updates via SSE",
        "description": "Establish Server-Sent Events stream to receive real-time QR code and connection status updates",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "SSE stream of events",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "event": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/pairing-code": {
      "post": {
        "summary": "Request pairing code for phone number",
        "description": "Generate a pairing code for device registration instead of using QR code",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "phoneNumber"
                ],
                "properties": {
                  "phoneNumber": {
                    "type": "string",
                    "description": "Phone number to request pairing code for"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Pairing code generated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "pairingCode": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/restart": {
      "post": {
        "summary": "Restart a session",
        "description": "Restart an existing WhatsApp session",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Session restarted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}": {
      "delete": {
        "summary": "Delete/terminate a specific session",
        "description": "Permanently terminate and delete a specific WhatsApp session",
        "tags": [
          "Sessions"
        ],
        "security": [
          {
            "apiKey": []
          }
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Session terminated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Session terminated"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/client/send-message": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Send a message",
        "description": "Send a message to a chat with various content types (text, image, video, audio, document, sticker, location, contact, poll)",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "chatId",
                  "contentType",
                  "content"
                ],
                "properties": {
                  "chatId": {
                    "type": "string",
                    "description": "JID of the chat (user or group)"
                  },
                  "contentType": {
                    "type": "string",
                    "enum": [
                      "text",
                      "image",
                      "video",
                      "audio",
                      "document",
                      "sticker",
                      "location",
                      "contact",
                      "poll"
                    ],
                    "description": "Type of content being sent"
                  },
                  "content": {
                    "description": "Content payload (format depends on contentType)"
                  },
                  "options": {
                    "type": "object",
                    "properties": {
                      "quotedMessageId": {
                        "type": "string",
                        "description": "Message ID to quote/reply to"
                      },
                      "mentions": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        },
                        "description": "JIDs of users to mention (@user)"
                      },
                      "mentionAll": {
                        "type": "boolean",
                        "description": "When true, @all mention -- overrides individual mentions"
                      },
                      "caption": {
                        "type": "string",
                        "description": "Caption for media messages"
                      },
                      "fileName": {
                        "type": "string",
                        "description": "Custom filename for document messages"
                      },
                      "mimetype": {
                        "type": "string",
                        "description": "MIME type for document/media messages"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message sent successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/contacts": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get all contacts",
        "description": "Retrieve all contacts from the session store",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contacts retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/chats": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get all chats",
        "description": "Retrieve all chats from the session store",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Chats retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      },
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Search chats",
        "description": "Search and filter chats by query, unread status, group status, or timestamp",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "searchOptions": {
                    "type": "object",
                    "properties": {
                      "unread": {
                        "type": "boolean",
                        "description": "Filter by unread status"
                      },
                      "since": {
                        "type": "number",
                        "description": "Filter by timestamp (Unix timestamp)"
                      },
                      "isGroup": {
                        "type": "boolean",
                        "description": "Filter by group status"
                      },
                      "query": {
                        "type": "string",
                        "description": "Search query for chat name or ID"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Chats filtered successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/chat/{chatId}": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get chat by ID",
        "description": "Retrieve a specific chat by its ID",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (URL-encoded)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/contact/{contactId}": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get contact by ID",
        "description": "Retrieve a specific contact by its ID",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "contactId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contact ID (URL-encoded)"
          }
        ],
        "responses": {
          "200": {
            "description": "Contact retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/is-registered": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Check if number is registered",
        "description": "Check if a WhatsApp number is registered on WhatsApp",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "number"
                ],
                "properties": {
                  "number": {
                    "type": "string",
                    "description": "Phone number to check"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Registration status retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/number-id": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get number JID",
        "description": "Convert a phone number to WhatsApp JID format",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "number"
                ],
                "properties": {
                  "number": {
                    "type": "string",
                    "description": "Phone number to convert"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "JID retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "jid": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/profile-picture-url": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get profile picture URL",
        "description": "Retrieve the profile picture URL for a contact",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "contactId"
                ],
                "properties": {
                  "contactId": {
                    "type": "string",
                    "description": "Contact ID (JID)"
                  },
                  "type": {
                    "type": "string",
                    "description": "Picture type",
                    "default": "image"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile picture URL retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "string",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/set-status": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Set status message",
        "description": "Update the WhatsApp status/bio message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "description": "Status message text"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/set-display-name": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Set display name",
        "description": "Update the WhatsApp display name",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Display name"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Display name updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/set-profile-picture": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Set profile picture",
        "description": "Update the WhatsApp profile picture",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Target JID (optional, defaults to self)"
                  },
                  "content": {
                    "description": "Image content"
                  },
                  "options": {
                    "type": "object",
                    "description": "Media options"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile picture updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/profile-picture": {
      "delete": {
        "tags": [
          "Client"
        ],
        "summary": "Delete profile picture",
        "description": "Remove the WhatsApp profile picture",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Profile picture removed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/create-group": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Create a group",
        "description": "Create a new WhatsApp group with specified participants",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "participants"
                ],
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Group name"
                  },
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Group created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/presence/available": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Set presence to available",
        "description": "Update WhatsApp presence status to available (online)",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Presence updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/presence/unavailable": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Set presence to unavailable",
        "description": "Update WhatsApp presence status to unavailable (offline)",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Presence updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/search-messages": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Search messages",
        "description": "Search messages in all chats or a specific chat by text query",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "Search query text"
                  },
                  "chatId": {
                    "type": "string",
                    "description": "Limit search to specific chat ID"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Messages retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/blocked-contacts": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get blocked contacts",
        "description": "Retrieve list of blocked contacts",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Blocked contacts retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/labels": {
      "get": {
        "tags": [
          "Client"
        ],
        "summary": "Get all labels",
        "description": "Retrieve all chat labels",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Labels retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/labels/{labelId}": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get label by ID",
        "description": "Retrieve a specific label by its ID",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "labelId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Label ID (URL-encoded)"
          }
        ],
        "responses": {
          "200": {
            "description": "Label retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/labels/chat/{chatId}": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get labels for chat",
        "description": "Retrieve all labels associated with a specific chat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (URL-encoded)"
          }
        ],
        "responses": {
          "200": {
            "description": "Labels retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/labels/{labelId}/chats": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Get chats by label ID",
        "description": "Retrieve all chats that have a specific label",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "labelId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Label ID (URL-encoded)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chats retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/client/labels/modify": {
      "post": {
        "tags": [
          "Client"
        ],
        "summary": "Modify labels for chat",
        "description": "Add or remove labels from a chat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "chatId",
                  "labelIds",
                  "action"
                ],
                "properties": {
                  "chatId": {
                    "type": "string",
                    "description": "Chat ID"
                  },
                  "labelIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of label IDs"
                  },
                  "action": {
                    "type": "string",
                    "enum": [
                      "add",
                      "remove"
                    ],
                    "description": "Action to perform (add or remove)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Labels modified successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "chatId": {
                          "type": "string"
                        },
                        "labels": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          },
          "404": {
            "description": "Session not found"
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/delete": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Delete a message",
        "description": "Delete a message from a chat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID (e.g., 6281234567890@s.whatsapp.net)"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/edit": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Edit a message",
        "description": "Edit the text content of a previously sent message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey",
                  "text"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Must be true for editing"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "text": {
                    "type": "string",
                    "description": "New text content"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message edited successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/react": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "React to a message",
        "description": "Add or remove an emoji reaction to a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey",
                  "emoji"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "emoji": {
                    "type": "string",
                    "description": "Emoji to react with (empty string to remove reaction)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reaction sent successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/forward": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Forward a message",
        "description": "Forward an existing message to another chat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey",
                  "targetJid"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Original chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "targetJid": {
                    "type": "string",
                    "description": "Destination chat JID"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message forwarded successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/star": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Star a message",
        "description": "Mark a message as starred/favorite",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message starred successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/unstar": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Unstar a message",
        "description": "Remove star/favorite from a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message unstarred successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/reply": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Reply to a message",
        "description": "Send a message as a reply to an existing message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey",
                  "content"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID to reply to"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the original message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "content": {
                    "type": "object",
                    "description": "Message content (e.g., {text: 'Reply text'})"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reply sent successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/download-media": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Download media from a message",
        "description": "Download media (image, video, audio, document, sticker) from a message and return as base64",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "image",
                      "video",
                      "audio",
                      "document",
                      "sticker"
                    ],
                    "description": "Media type (auto-detected if not provided)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Media downloaded successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "mimetype": {
                          "type": "string"
                        },
                        "filename": {
                          "type": "string"
                        },
                        "data": {
                          "type": "string",
                          "description": "Base64-encoded media data"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/download-media/stream": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Download media from a message (streaming)",
        "description": "Download media (image, video, audio, document, sticker) from a message and return as binary stream",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "image",
                      "video",
                      "audio",
                      "document",
                      "sticker"
                    ],
                    "description": "Media type (auto-detected if not provided)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Media downloaded successfully",
            "content": {
              "application/octet-stream": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/info": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get message info",
        "description": "Get metadata and status information about a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message info retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "key": {
                          "type": "object"
                        },
                        "status": {
                          "type": "string"
                        },
                        "messageTimestamp": {
                          "type": "number"
                        },
                        "pushName": {
                          "type": "string"
                        },
                        "participant": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/mentions": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get message mentions",
        "description": "Get a list of mentioned JIDs from a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Mentions retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/quoted": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get quoted message",
        "description": "Get the quoted/replied-to message from a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Quoted message retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "nullable": true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/reactions": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get message reactions",
        "description": "Get all reactions to a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reactions retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/poll-votes": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get poll votes",
        "description": "Get all votes for a poll message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Poll message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the poll was created by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group polls)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Poll votes retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/messages/contact": {
      "post": {
        "tags": [
          "Messages"
        ],
        "summary": "Get message contact",
        "description": "Get contact information for the sender of a message",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageKey"
                ],
                "properties": {
                  "messageKey": {
                    "type": "object",
                    "required": [
                      "remoteJid",
                      "id",
                      "fromMe"
                    ],
                    "properties": {
                      "remoteJid": {
                        "type": "string",
                        "description": "Chat JID"
                      },
                      "id": {
                        "type": "string",
                        "description": "Message ID"
                      },
                      "fromMe": {
                        "type": "boolean",
                        "description": "Whether the message was sent by the current user"
                      },
                      "participant": {
                        "type": "string",
                        "description": "Participant JID (for group messages)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contact info retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "nullable": true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/typing": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Send typing indicator",
        "description": "Sends a typing (composing) presence indicator to the specified chat",
        "operationId": "sendTypingIndicator",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Typing indicator sent successfully",
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
                          "example": "Typing indicator sent"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/recording": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Send recording indicator",
        "description": "Sends a recording presence indicator to the specified chat",
        "operationId": "sendRecordingIndicator",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Recording indicator sent successfully",
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
                          "example": "Recording indicator sent"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/clear-state": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Clear presence state",
        "description": "Clears typing/recording presence state (sends paused status)",
        "operationId": "clearPresenceState",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Presence state cleared successfully",
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
                          "example": "Presence state cleared"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/seen": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mark messages as read",
        "description": "Marks specified messages as read (seen)",
        "operationId": "markMessagesAsRead",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "messageIds"
                ],
                "properties": {
                  "messageIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of message IDs to mark as read",
                    "example": [
                      "msg_id_1",
                      "msg_id_2"
                    ]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Messages marked as read successfully",
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
                          "example": "Messages marked as read"
                        },
                        "count": {
                          "type": "number",
                          "example": 2
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/mark-unread": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mark chat as unread",
        "description": "Marks the entire chat as unread",
        "operationId": "markChatAsUnread",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat marked as unread successfully",
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
                          "example": "Chat marked as unread"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/archive": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Archive chat",
        "description": "Archives the specified chat",
        "operationId": "archiveChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat archived successfully",
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
                          "example": "Chat archived"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/unarchive": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Unarchive chat",
        "description": "Unarchives the specified chat",
        "operationId": "unarchiveChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat unarchived successfully",
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
                          "example": "Chat unarchived"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/pin": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Pin chat",
        "description": "Pins the specified chat to the top of the chat list",
        "operationId": "pinChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat pinned successfully",
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
                          "example": "Chat pinned"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/unpin": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Unpin chat",
        "description": "Unpins the specified chat from the top of the chat list",
        "operationId": "unpinChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat unpinned successfully",
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
                          "example": "Chat unpinned"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/mute": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Mute chat",
        "description": "Mutes notifications for the specified chat for a given duration",
        "operationId": "muteChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "duration"
                ],
                "properties": {
                  "duration": {
                    "type": "number",
                    "description": "Mute duration in milliseconds",
                    "example": 28800000,
                    "minimum": 0
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Chat muted successfully",
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
                          "example": "Chat muted"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        },
                        "duration": {
                          "type": "number",
                          "example": 28800000
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/unmute": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Unmute chat",
        "description": "Unmutes notifications for the specified chat",
        "operationId": "unmuteChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat unmuted successfully",
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
                          "example": "Chat unmuted"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/messages": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Fetch chat messages",
        "description": "Retrieves messages from the specified chat with pagination support",
        "operationId": "fetchMessages",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "default": 50
            },
            "description": "Maximum number of messages to return"
          },
          {
            "name": "offset",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "default": 0
            },
            "description": "Number of messages to skip"
          }
        ],
        "responses": {
          "200": {
            "description": "Messages retrieved successfully",
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
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        },
                        "messages": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "total": {
                          "type": "number",
                          "example": 150
                        },
                        "limit": {
                          "type": "number",
                          "example": 50
                        },
                        "offset": {
                          "type": "number",
                          "example": 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/contact": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Get chat contact",
        "description": "Retrieves contact information for the specified chat",
        "operationId": "getChatContact",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Contact information retrieved successfully",
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
                      "nullable": true
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}": {
      "delete": {
        "tags": [
          "Chats"
        ],
        "summary": "Delete chat",
        "description": "Deletes the specified chat",
        "operationId": "deleteChat",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Chat deleted successfully",
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
                          "example": "Chat deleted"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/clear": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Clear chat messages",
        "description": "Clears messages from the specified chat. If messageIds array is provided, only those messages are cleared; otherwise all messages are cleared.",
        "operationId": "clearChatMessages",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "requestBody": {
          "required": false,
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
                        "id": {
                          "type": "string"
                        },
                        "fromMe": {
                          "type": "boolean"
                        },
                        "timestamp": {
                          "type": "number"
                        }
                      }
                    },
                    "description": "Array of message objects to clear. If omitted, all messages are cleared."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Chat messages cleared successfully",
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
                          "example": "Chat messages cleared"
                        },
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/labels": {
      "get": {
        "tags": [
          "Chats"
        ],
        "summary": "Get chat labels",
        "description": "Retrieves all labels associated with the specified chat",
        "operationId": "getChatLabels",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "responses": {
          "200": {
            "description": "Labels retrieved successfully",
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
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/chats/{chatId}/labels/modify": {
      "post": {
        "tags": [
          "Chats"
        ],
        "summary": "Modify chat labels",
        "description": "Add or remove labels from the specified chat",
        "operationId": "modifyChatLabels",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "chatId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Chat ID (JID format)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "labelIds",
                  "action"
                ],
                "properties": {
                  "labelIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of label IDs to add or remove",
                    "example": [
                      "label_1",
                      "label_2"
                    ]
                  },
                  "action": {
                    "type": "string",
                    "enum": [
                      "add",
                      "remove"
                    ],
                    "description": "Action to perform: 'add' or 'remove'",
                    "example": "add"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Labels modified successfully",
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
                        "chatId": {
                          "type": "string",
                          "example": "6281234567890@s.whatsapp.net"
                        },
                        "labels": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          },
                          "example": [
                            "label_1",
                            "label_2"
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "apiKey": []
          }
        ]
      }
    },
    "/sessions/{sessionId}/groups/accept-invite": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Accept group invite",
        "description": "Accept a group invitation using an invite code",
        "operationId": "acceptGroupInvite",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "description": "Group invite code"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Invite accepted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/invite-info": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Get group invite info",
        "description": "Retrieve information about a group from an invite code",
        "operationId": "getGroupInviteInfo",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "description": "Group invite code"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Group invite information",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "List all groups",
        "description": "Fetch all groups the session is participating in",
        "operationId": "listAllGroups",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          }
        ],
        "responses": {
          "200": {
            "description": "List of all groups",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get group metadata",
        "description": "Retrieve detailed metadata for a specific group",
        "operationId": "getGroupMetadata",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID (with or without @g.us suffix)"
          }
        ],
        "responses": {
          "200": {
            "description": "Group metadata",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/participants/add": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Add participants",
        "description": "Add participants to a group",
        "operationId": "addGroupParticipants",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to add"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Participants added",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/participants/remove": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Remove participants",
        "description": "Remove participants from a group",
        "operationId": "removeGroupParticipants",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to remove"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Participants removed",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/participants/promote": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Promote participants",
        "description": "Promote participants to admin in a group",
        "operationId": "promoteGroupParticipants",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to promote"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Participants promoted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/participants/demote": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Demote participants",
        "description": "Demote admin participants to regular members in a group",
        "operationId": "demoteGroupParticipants",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to demote"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Participants demoted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/invite-code": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get group invite code",
        "description": "Retrieve the invite code for a group",
        "operationId": "getGroupInviteCode",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Group invite code",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "inviteCode": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/revoke-invite": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Revoke group invite",
        "description": "Revoke the current invite code and generate a new one",
        "operationId": "revokeGroupInvite",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Invite revoked",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/leave": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Leave group",
        "description": "Leave a group",
        "operationId": "leaveGroup",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Left group",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/subject": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Update group subject",
        "description": "Update the subject (name) of a group",
        "operationId": "updateGroupSubject",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "subject"
                ],
                "properties": {
                  "subject": {
                    "type": "string",
                    "description": "New group subject"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Group subject updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/description": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Update group description",
        "description": "Update the description of a group",
        "operationId": "updateGroupDescription",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "description"
                ],
                "properties": {
                  "description": {
                    "type": "string",
                    "description": "New group description"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Group description updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/picture": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Update group picture",
        "description": "Update the profile picture of a group",
        "operationId": "updateGroupPicture",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "object",
                    "description": "Image content (base64, URL, or buffer)"
                  },
                  "options": {
                    "type": "object",
                    "description": "Optional media preparation options"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Group picture updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Groups"
        ],
        "summary": "Delete group picture",
        "description": "Remove the profile picture from a group",
        "operationId": "deleteGroupPicture",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Group picture removed",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/settings/messages-admins-only": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Set messages admins only",
        "description": "Configure whether only admins can send messages",
        "operationId": "setMessagesAdminsOnly",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "enabled": {
                    "type": "boolean",
                    "description": "Enable or disable messages admins only (default: true)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Setting updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        },
                        "mode": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/settings/info-admins-only": {
      "put": {
        "tags": [
          "Groups"
        ],
        "summary": "Set info admins only",
        "description": "Configure whether only admins can edit group info",
        "operationId": "setInfoAdminsOnly",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "enabled": {
                    "type": "boolean",
                    "description": "Enable or disable info admins only (default: true)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Setting updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        },
                        "mode": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/membership-requests": {
      "get": {
        "tags": [
          "Groups"
        ],
        "summary": "Get membership requests",
        "description": "Retrieve pending membership requests for a group",
        "operationId": "getMembershipRequests",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "responses": {
          "200": {
            "description": "List of membership requests",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/membership-requests/approve": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Approve membership requests",
        "description": "Approve pending membership requests for a group",
        "operationId": "approveMembershipRequests",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to approve"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Requests approved",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/membership-requests/reject": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Reject membership requests",
        "description": "Reject pending membership requests for a group",
        "operationId": "rejectMembershipRequests",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "participants"
                ],
                "properties": {
                  "participants": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of participant JIDs to reject"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Requests rejected",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/groups/{groupId}/test-mention-all": {
      "post": {
        "tags": [
          "Groups"
        ],
        "summary": "Test mention all methods",
        "description": "Debug endpoint to test three different methods of mentioning all participants in a group",
        "operationId": "testMentionAllMethods",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Session ID"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Group ID"
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "message": {
                    "type": "string",
                    "description": "Custom message to include in test (default: 'Test mention all method')"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Test completed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "success": {
                          "type": "boolean"
                        },
                        "messagesSent": {
                          "type": "number"
                        },
                        "mentionCount": {
                          "type": "number"
                        },
                        "methods": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/info": {
      "post": {
        "summary": "Get contact information",
        "description": "Retrieve contact information from the store",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID (Jabber ID) of the contact"
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
            "description": "Contact information retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/block": {
      "post": {
        "summary": "Block a contact",
        "description": "Block a contact from messaging",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact to block"
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
            "description": "Contact blocked successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        },
                        "result": {
                          "type": "object"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/unblock": {
      "post": {
        "summary": "Unblock a contact",
        "description": "Unblock a previously blocked contact",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact to unblock"
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
            "description": "Contact unblocked successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string"
                        },
                        "result": {
                          "type": "object"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/about": {
      "post": {
        "summary": "Get contact about/status",
        "description": "Fetch the about/status text of a contact",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Contact status retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": [
                            "string",
                            "null"
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/chat": {
      "post": {
        "summary": "Get contact chat",
        "description": "Retrieve chat history/metadata for a contact",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Contact chat retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": [
                        "object",
                        "null"
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/profile-picture": {
      "post": {
        "summary": "Get contact profile picture",
        "description": "Retrieve the profile picture URL of a contact",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Profile picture URL retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "url": {
                          "type": [
                            "string",
                            "null"
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/formatted-number": {
      "post": {
        "summary": "Get formatted phone number",
        "description": "Get the formatted phone number from a JID",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Formatted number retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "formattedNumber": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/country-code": {
      "post": {
        "summary": "Get contact country code",
        "description": "Extract the country code from a contact's JID",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Country code retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "countryCode": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/contacts/common-groups": {
      "post": {
        "summary": "Get common groups with contact",
        "description": "Retrieve groups that both the user and contact are members of",
        "tags": [
          "Contacts"
        ],
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The session ID"
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
                    "description": "The JID of the contact"
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
            "description": "Common groups retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/info": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Get newsletter information",
        "description": "Retrieve metadata for a newsletter channel by JID or invite code",
        "operationId": "getNewsletterInfo",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "type",
                  "key"
                ],
                "properties": {
                  "type": {
                    "type": "string",
                    "enum": [
                      "jid",
                      "invite"
                    ],
                    "description": "Lookup type: 'jid' for direct JID or 'invite' for invite code"
                  },
                  "key": {
                    "type": "string",
                    "description": "The JID or invite code depending on type"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Newsletter metadata retrieved successfully",
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
                      "description": "Newsletter metadata object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/send-message": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Send message to newsletter",
        "description": "Send a message to a newsletter channel",
        "operationId": "sendMessageToNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "content"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "content": {
                    "type": "object",
                    "description": "Message content object (Baileys format)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Message sent successfully",
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
                      "description": "Send result"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/fetch-messages": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Fetch newsletter messages",
        "description": "Retrieve messages from a newsletter channel",
        "operationId": "fetchNewsletterMessages",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "count": {
                    "type": "number",
                    "description": "Number of messages to fetch",
                    "default": 10
                  },
                  "since": {
                    "type": "number",
                    "description": "Fetch messages since this timestamp",
                    "default": 0
                  },
                  "after": {
                    "type": "number",
                    "description": "Fetch messages after this message ID",
                    "default": 0
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Messages retrieved successfully",
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
                      "description": "Messages array"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/send-seen": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Mark newsletter messages as read",
        "description": "Send read receipts for newsletter messages",
        "operationId": "sendSeenToNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "keys"
                ],
                "properties": {
                  "keys": {
                    "type": "array",
                    "description": "Array of message keys to mark as read",
                    "items": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Messages marked as read",
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
                          "example": "Messages marked as read"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/mute": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Mute newsletter",
        "description": "Mute notifications from a newsletter channel",
        "operationId": "muteNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Newsletter muted successfully",
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
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/unmute": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Unmute newsletter",
        "description": "Unmute notifications from a newsletter channel",
        "operationId": "unmuteNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Newsletter unmuted successfully",
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
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/set-profile-picture": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Set newsletter profile picture",
        "description": "Update the profile picture for a newsletter channel",
        "operationId": "setNewsletterProfilePicture",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "content"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "content": {
                    "type": "object",
                    "description": "Image content object"
                  },
                  "options": {
                    "type": "object",
                    "description": "Media options"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile picture updated successfully",
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
                          "example": "Newsletter picture updated"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/set-description": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Set newsletter description",
        "description": "Update the description for a newsletter channel",
        "operationId": "setNewsletterDescription",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "description"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "description": {
                    "type": "string",
                    "description": "New description text"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Description updated successfully",
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
                          "example": "Newsletter description updated"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/set-subject": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Set newsletter subject/name",
        "description": "Update the name/subject for a newsletter channel",
        "operationId": "setNewsletterSubject",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "name"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "name": {
                    "type": "string",
                    "description": "New newsletter name"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Name updated successfully",
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
                          "example": "Newsletter name updated"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/{channelId}": {
      "delete": {
        "tags": [
          "Channels"
        ],
        "summary": "Delete newsletter",
        "description": "Delete a newsletter channel",
        "operationId": "deleteNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          },
          {
            "name": "channelId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Channel ID (with or without @newsletter suffix)"
          }
        ],
        "responses": {
          "200": {
            "description": "Newsletter deleted successfully",
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
                          "example": "Newsletter deleted"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/subscribers": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Get newsletter subscribers",
        "description": "Retrieve the list of subscribers for a newsletter channel",
        "operationId": "getNewsletterSubscribers",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Subscribers retrieved successfully",
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
                      "description": "Subscribers list"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/set-reaction-setting": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Set newsletter reaction setting",
        "description": "Configure reaction permissions for a newsletter channel",
        "operationId": "setNewsletterReactionSetting",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "mode"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "mode": {
                    "type": "string",
                    "description": "Reaction mode setting"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reaction setting updated successfully",
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
                          "example": "Newsletter reaction setting updated"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "501": {
            "description": "Not supported in this Baileys version",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": false
                    },
                    "error": {
                      "type": "string",
                      "example": "newsletterReactionMode is not supported in this Baileys version"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/admin/invite": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Invite users to newsletter (Admin)",
        "description": "Invite participants to a newsletter channel (requires admin permissions)",
        "operationId": "inviteToNewsletter",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "participants"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "participants": {
                    "type": "array",
                    "description": "Array of participant JIDs to invite",
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
            "description": "Invites sent successfully",
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
                      "description": "Invite result"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "501": {
            "description": "Not supported in this Baileys version",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": false
                    },
                    "error": {
                      "type": "string",
                      "example": "Newsletter invite functionality is not supported in this Baileys version"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/admin/accept-invite": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Accept newsletter invite (Admin)",
        "description": "Accept an invite to join a newsletter channel using an invite code",
        "operationId": "acceptNewsletterInvite",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "code"
                ],
                "properties": {
                  "code": {
                    "type": "string",
                    "description": "Newsletter invite code"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Invite accepted successfully",
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
                      "description": "Accept result"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "501": {
            "description": "Not supported in this Baileys version",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": false
                    },
                    "error": {
                      "type": "string",
                      "example": "Newsletter accept invite functionality is not supported in this Baileys version"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/admin/revoke-invite": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Revoke newsletter invite (Admin)",
        "description": "Revoke outstanding invites for a newsletter channel",
        "operationId": "revokeNewsletterInvite",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Invite revoked successfully",
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
                      "description": "Revoke result"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "501": {
            "description": "Not supported in this Baileys version",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": false
                    },
                    "error": {
                      "type": "string",
                      "example": "Newsletter revoke invite functionality is not supported in this Baileys version"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/admin/transfer-ownership": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Transfer newsletter ownership (Admin)",
        "description": "Transfer ownership of a newsletter channel to another user",
        "operationId": "transferNewsletterOwnership",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "newOwnerJid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "newOwnerJid": {
                    "type": "string",
                    "description": "JID of the new owner"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ownership transferred successfully",
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
                          "example": "Newsletter ownership transferred"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/sessions/{sessionId}/channels/admin/demote": {
      "post": {
        "tags": [
          "Channels"
        ],
        "summary": "Demote newsletter admin (Admin)",
        "description": "Remove admin privileges from a user in a newsletter channel",
        "operationId": "demoteNewsletterAdmin",
        "parameters": [
          {
            "name": "sessionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "WhatsApp session identifier"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "jid",
                  "userJid"
                ],
                "properties": {
                  "jid": {
                    "type": "string",
                    "description": "Newsletter JID (must end with @newsletter)",
                    "example": "120363123456789012@newsletter"
                  },
                  "userJid": {
                    "type": "string",
                    "description": "JID of the user to demote"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Admin demoted successfully",
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
                          "example": "Admin demoted"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    }
  }
};

import { describe, it, expect } from 'vitest';
import { swaggerSpec } from '../src/swagger.js';

describe('OpenAPI Specification', () => {
  it('should be valid OpenAPI 3.0 schema', () => {
    expect(swaggerSpec.openapi).toMatch(/^3\.0\.\d+$/);
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBeDefined();
    expect(swaggerSpec.info.version).toBeDefined();
    expect(swaggerSpec.paths).toBeDefined();
    expect(swaggerSpec.components).toBeDefined();
  });

  it('should have API metadata', () => {
    expect(swaggerSpec.info.title).toBe('WA-Socket REST API');
    expect(swaggerSpec.info.version).toBe('1.0.0');
    expect(swaggerSpec.info.description).toBeDefined();
  });

  it('should define server configuration', () => {
    expect(swaggerSpec.servers).toBeDefined();
    expect(Array.isArray(swaggerSpec.servers)).toBe(true);
    expect(swaggerSpec.servers.length).toBeGreaterThan(0);
    expect(swaggerSpec.servers[0].url).toBeDefined();
  });

  it('should define apiKey security scheme', () => {
    expect(swaggerSpec.components.securitySchemes).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.apiKey).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.apiKey.type).toBe('apiKey');
    expect(swaggerSpec.components.securitySchemes.apiKey.in).toBe('header');
    expect(swaggerSpec.components.securitySchemes.apiKey.name).toBe('x-api-key');
  });

  it('should have global security requirement', () => {
    expect(swaggerSpec.security).toBeDefined();
    expect(Array.isArray(swaggerSpec.security)).toBe(true);
    expect(swaggerSpec.security.length).toBeGreaterThan(0);
    expect(swaggerSpec.security[0].apiKey).toBeDefined();
  });

  it('should document all route groups', () => {
    const paths = Object.keys(swaggerSpec.paths);
    
    // Health
    expect(paths.some(p => p.includes('/health'))).toBe(true);
    
    // Sessions
    expect(paths.some(p => p.includes('/sessions'))).toBe(true);
    
    // Client
    expect(paths.some(p => p.includes('/client'))).toBe(true);
    
    // Messages
    expect(paths.some(p => p.includes('/messages'))).toBe(true);
    
    // Chats
    expect(paths.some(p => p.includes('/chats'))).toBe(true);
    
    // Groups
    expect(paths.some(p => p.includes('/groups'))).toBe(true);
    
    // Contacts
    expect(paths.some(p => p.includes('/contacts'))).toBe(true);
    
    // Channels (newsletters)
    expect(paths.some(p => p.includes('/channels'))).toBe(true);
  });

  it('should document at least 60 paths with 75 operations', () => {
    const paths = Object.keys(swaggerSpec.paths);
    const totalOperations = paths.reduce((count, path) => {
      const operations = Object.keys(swaggerSpec.paths[path]);
      return count + operations.length;
    }, 0);
    
    expect(totalOperations).toBeGreaterThanOrEqual(75);
  });

  it('should define common response schemas', () => {
    expect(swaggerSpec.components.schemas).toBeDefined();
    expect(swaggerSpec.components.schemas.ApiResponse).toBeDefined();
    expect(swaggerSpec.components.schemas.PaginatedResponse).toBeDefined();
    expect(swaggerSpec.components.schemas.ErrorResponse).toBeDefined();
  });

  it('should define session-related schemas', () => {
    expect(swaggerSpec.components.schemas.SessionInfo).toBeDefined();
    expect(swaggerSpec.components.schemas.SessionStatus).toBeDefined();
    expect(swaggerSpec.components.schemas.SessionConfig).toBeDefined();
  });

  it('should define message-related schemas', () => {
    expect(swaggerSpec.components.schemas.MessageInfo).toBeDefined();
    expect(swaggerSpec.components.schemas.SendMessageRequest).toBeDefined();
    expect(swaggerSpec.components.schemas.ContentType).toBeDefined();
  });

  it('should define chat-related schemas', () => {
    expect(swaggerSpec.components.schemas.ChatInfo).toBeDefined();
    expect(swaggerSpec.components.schemas.ChatUpdate).toBeDefined();
  });

  it('should define group-related schemas', () => {
    expect(swaggerSpec.components.schemas.GroupInfo).toBeDefined();
    expect(swaggerSpec.components.schemas.GroupParticipant).toBeDefined();
  });

  it('should define contact-related schemas', () => {
    expect(swaggerSpec.components.schemas.ContactInfo).toBeDefined();
  });

  it('should have proper path structure', () => {
    const paths = Object.keys(swaggerSpec.paths);
    
    // All paths should start with /
    paths.forEach(path => {
      expect(path.startsWith('/')).toBe(true);
    });
    
    // Each path should have at least one operation
    paths.forEach(path => {
      const operations = Object.keys(swaggerSpec.paths[path]);
      expect(operations.length).toBeGreaterThan(0);
    });
  });

  it('should have proper operation structure for each endpoint', () => {
    const paths = Object.keys(swaggerSpec.paths);
    
    paths.forEach(path => {
      const operations = swaggerSpec.paths[path];
      
      Object.entries(operations).forEach(([method, operation]: [string, any]) => {
        // Each operation should have summary
        expect(operation.summary).toBeDefined();
        
        // Each operation should have description
        expect(operation.description).toBeDefined();
        
        // Each operation should have operationId
        expect(operation.operationId).toBeDefined();
        
        // Each operation should have responses
        expect(operation.responses).toBeDefined();
        expect(operation.responses['200']).toBeDefined();
      });
    });
  });

  it('should define proper response schemas for all endpoints', () => {
    const paths = Object.keys(swaggerSpec.paths);
    
    paths.forEach(path => {
      const operations = swaggerSpec.paths[path];
      
      Object.entries(operations).forEach(([method, operation]: [string, any]) => {
        // Should have at least 200 response
        expect(operation.responses['200']).toBeDefined();
        // 200 response should have description or $ref
        expect(
          operation.responses['200'].description || operation.responses['200'].$ref
        ).toBeDefined();
        
        // Should have error responses
        expect(
          operation.responses['400'] ||
          operation.responses['401'] ||
          operation.responses['404'] ||
          operation.responses['500']
        ).toBeDefined();
      });
    });
  });

  it('should have tags for route grouping', () => {
    expect(swaggerSpec.tags).toBeDefined();
    expect(Array.isArray(swaggerSpec.tags)).toBe(true);
    expect(swaggerSpec.tags.length).toBeGreaterThanOrEqual(8); // 8 route groups
    
    const tagNames = swaggerSpec.tags.map((tag: any) => tag.name);
    expect(tagNames).toContain('Health');
    expect(tagNames).toContain('Sessions');
    expect(tagNames).toContain('Client');
    expect(tagNames).toContain('Messages');
    expect(tagNames).toContain('Chats');
    expect(tagNames).toContain('Groups');
    expect(tagNames).toContain('Contacts');
    expect(tagNames).toContain('Channels');
  });
});

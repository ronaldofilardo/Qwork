// Mock local para permitir que testes que fazem jest.mock('../lib/session')
// funcionem mesmo quando a importação relativa aponta para __tests__/lib
module.exports = {
  getSession: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  requireClinica: jest.fn(),
  requireEntity: jest.fn(),
  createSession: jest.fn(),
  regenerateSession: jest.fn(),
  destroySession: jest.fn(),
};

describe('Session Mock', () => {
  it('should export mocked functions', () => {
    expect(module.exports.getSession).toBeDefined();
  });
});

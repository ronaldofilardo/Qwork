import { query } from '@/lib/db';

describe('audit_log_with_context defensive behavior', () => {
  it('should insert an audit log and return its id', async () => {
    const action = 'TEST_DEFENSIVE_AUDIT';
    const resource = 'funcionarios';
    const resourceId = 'TEST-000';
    const details = 'Test insert via audit_log_with_context';
    const userCpf = '00000000000';

    const res = await query(
      'SELECT audit_log_with_context($1, $2, $3, $4, $5, NULL, NULL) as id',
      [resource, action, resourceId, details, userCpf]
    );

    expect(res.rowCount).toBeGreaterThan(0);
    const id = res.rows[0].id;
    expect(id).toBeTruthy();

    // Verify the record exists in audit_logs
    const check = await query(
      'SELECT action, resource, resource_id FROM audit_logs WHERE id = $1',
      [id]
    );
    expect(check.rowCount).toBe(1);
    expect(check.rows[0].action).toBe(action);
    expect(check.rows[0].resource).toBe(resource);
    expect(check.rows[0].resource_id).toBe(resourceId);
  });
});

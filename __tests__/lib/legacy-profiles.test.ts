import { TypeValidators, PERFIS_VALIDOS } from '@/lib/types/enums';

describe('Legacy profile validations', () => {
  it('should not consider "master" or "super" as valid profiles', () => {
    expect(TypeValidators.isPerfil('master')).toBe(false);
    expect(TypeValidators.isPerfil('super')).toBe(false);
  });

  it('should consider "admin" as valid profile and included in PERFIS_VALIDOS', () => {
    expect(TypeValidators.isPerfil('admin')).toBe(true);
    expect(PERFIS_VALIDOS.includes('admin')).toBe(true);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminSidebar from '@/components/admin/AdminSidebar';

describe('AdminSidebar', () => {
  it('não deve renderizar o item "Informações da Conta" para admin', () => {
    render(
      <AdminSidebar
        activeSection={'novos-cadastros'}
        onSectionChange={() => {}}
        counts={{}}
      />
    );

    const infoButton = screen.queryByText('Informações da Conta');
    expect(infoButton).toBeNull();
  });
});

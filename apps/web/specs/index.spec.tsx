import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

describe('Page', () => {
  it('should identify the application', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', {
        name: 'E-commerce AI Support Assistant',
      }),
    ).toBeTruthy();
  });
});

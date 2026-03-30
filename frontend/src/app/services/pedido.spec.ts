import { TestBed } from '@angular/core/testing';

import { Peiddo } from './peiddo';

describe('Peiddo', () => {
  let service: Peiddo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Peiddo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

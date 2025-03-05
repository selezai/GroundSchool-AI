test('Babel transforms ES features correctly', () => {
  const arrowFn = () => {};
  class TestClass {}
  
  expect(typeof arrowFn).toBe('function');
  expect(typeof TestClass).toBe('function');
});

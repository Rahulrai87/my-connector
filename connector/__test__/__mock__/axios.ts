const axiosMock = {
  create: jest.fn(() => axiosMock),
  get: jest.fn(),
};

export default axiosMock;
export const validateBody = (validator) => (req, _res, next) => {
  try {
    req.body = validator(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

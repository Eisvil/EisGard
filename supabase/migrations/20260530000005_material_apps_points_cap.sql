-- Security: add hard cap on points_awarded for material applications.
-- Without this, an admin (or compromised admin account) could award
-- an arbitrarily large number of points in a single action.
-- The cap (100 000) is roughly 100 000 ₽ worth of points at the default rate.

ALTER TABLE material_applications
  ADD CONSTRAINT material_applications_points_cap
  CHECK (points_awarded >= 0 AND points_awarded <= 100000);

-- Same protection for volunteer_applications
ALTER TABLE volunteer_applications
  ADD CONSTRAINT volunteer_applications_points_cap
  CHECK (points_awarded >= 0 AND points_awarded <= 100000);

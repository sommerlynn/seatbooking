CREATE VIEW building_area_view AS
SELECT school_id,building.building_id, building_name, area_id, area_name
FROM building_area LEFT JOIN building ON building_area.building_id = building.building_id
ORDER BY building_id ASC, area_id ASC
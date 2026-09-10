ALTER TABLE menus
    ADD CONSTRAINT chk_menus_availability
    CHECK (available_to IS NULL OR available_from IS NULL OR available_to >= available_from);

ALTER TABLE menu_sections
    ADD CONSTRAINT chk_menu_section_selections
    CHECK (minimum_selections >= 0 AND maximum_selections >= minimum_selections);

ALTER TABLE order_items
    ADD CONSTRAINT chk_order_item_reference
    CHECK (
        (item_type = 'MENU' AND menu_id IS NOT NULL AND product_id IS NULL)
        OR
        (item_type = 'PRODUCT' AND product_id IS NOT NULL AND menu_id IS NULL)
    );

CREATE UNIQUE INDEX uk_menus_name ON menus(name);
CREATE INDEX idx_menus_active_dates ON menus(active, available_from, available_to);
CREATE INDEX idx_menu_sections_menu_order ON menu_sections(menu_id, display_order);
CREATE INDEX idx_menu_options_section_active ON menu_options(menu_section_id, active);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_inventory_order ON inventory_movements(order_id);

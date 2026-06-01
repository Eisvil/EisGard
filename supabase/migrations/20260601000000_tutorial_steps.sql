-- Tutorial steps table: stores NPC tutorial step title/text editable by admin
CREATE TABLE tutorial_steps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_index       INTEGER NOT NULL,
  title            TEXT NOT NULL,
  text             TEXT NOT NULL,
  selector         TEXT,
  padding          INTEGER NOT NULL DEFAULT 12,
  interactive      BOOLEAN NOT NULL DEFAULT false,
  interactive_hint TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX tutorial_steps_sort_order_idx ON tutorial_steps(sort_order);
CREATE INDEX tutorial_steps_active_idx ON tutorial_steps(is_active, sort_order);

ALTER TABLE tutorial_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutorial_steps_select_public" ON tutorial_steps
  FOR SELECT USING (is_active = true);

CREATE POLICY "tutorial_steps_all_admin" ON tutorial_steps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER tutorial_steps_updated_at
  BEFORE UPDATE ON tutorial_steps
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Seed: 8 steps (new order per DECISIONS)
INSERT INTO tutorial_steps (step_index, sort_order, title, text, selector, padding, interactive, interactive_hint) VALUES
(0, 0,
 'Добро пожаловать в Живое Городище!',
 'Я — Ведун, старейшина этого поселения. Позволь провести тебя по нашим землям и рассказать, как ты можешь стать частью нашего общего дела.',
 NULL, 12, false, NULL),

(1, 1,
 'Карта городища',
 'Перед тобой живая карта поселения. Здесь ты видишь все объекты, которые мы возводим вместе — от кузницы до жилых изб.',
 '.settlement-map', 0, false, NULL),

(2, 2,
 'Объекты на карте',
 'Нажми на любой значок на карте — и узнаешь подробности об этом объекте: его историю, прогресс и как помочь.',
 '.hotspots', 8, true, 'Нажми на любой значок на карте выше'),

(3, 3,
 'Сведения об объекте',
 'Вот оно — описание выбранного места: история, прогресс сбора средств и кнопка «Поддержать». Выбери объект на карте — и ты увидишь его душу.',
 '.feature', 8, false, NULL),

(4, 4,
 'Твой статус',
 'Это твоё место в летописи городища. Каждый вклад — деньги, труд или материалы — превращается в баллы «Жизненная сила» и приближает тебя к новому титулу.',
 '.player-hud', 12, false, NULL),

(5, 5,
 'Общий вклад',
 'Здесь — статистика нашего общего дела и свежие записи летописи. Каждый вклад участника отражается здесь в реальном времени.',
 '.right-rail', 8, false, NULL),

(6, 6,
 'Как помочь',
 'Поддержать городище можно по-разному: пожертвовать деньги, привезти материалы, приехать на волонтёрский заезд или стать партнёром.',
 '.support', 8, false, NULL),

(7, 7,
 'Путь открыт',
 'Теперь ты знаешь дорогу. Становись частью Живого Городища — вместе мы строим нечто настоящее.',
 NULL, 12, false, NULL);

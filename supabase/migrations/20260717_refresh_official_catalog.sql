-- Refresh the first store with BR Korea's public menu catalog as of 2026-07-17.
-- Existing products, quantities, targets, availability, and custom rows are preserved.
-- New catalog rows begin at zero stock so they must be counted before use.

with target_store as (
  select id from stores order by id limit 1
), catalog(id, name, color, type) as (
  values
    (6001::bigint, '엄마는 외계인', '#9c27b0', 'fixed'),
    (6002, '민트 초콜릿 칩', '#3eb489', 'fixed'),
    (6003, '바닐라', '#fff8dc', 'fixed'),
    (6004, '초콜릿', '#5d4037', 'fixed'),
    (6005, '베리베리 스트로베리', '#ef5350', 'fixed'),
    (6006, '레인보우 샤베트', '#ff9800', 'fixed'),
    (6007, '아몬드 봉봉', '#d4a574', 'fixed'),
    (6008, '체리쥬빌레', '#c62828', 'fixed'),
    (6009, '뉴욕 치즈케이크', '#ffd54f', 'fixed'),
    (6010, '슈팅스타', '#7c4dff', 'fixed'),
    (6011, '자모카 아몬드 훠지', '#6d4c41', 'fixed'),
    (6012, '피스타치오 아몬드', '#aed581', 'fixed'),
    (6013, '오레오 쿠키 앤 밀크', '#424242', 'fixed'),
    (6014, '사랑에 빠진 딸기', '#f48fb1', 'fixed'),
    (6015, '31요거트', '#fff9c4', 'fixed'),
    (6016, '바람과 함께 사라지다', '#90caf9', 'fixed'),
    (6017, '초콜릿 무스', '#6d4c41', 'fixed'),
    (6018, '그린티', '#81c784', 'fixed'),
    (6019, '알폰소 망고', '#ffb74d', 'fixed'),
    (6020, '애플민트', '#80cbc4', 'fixed'),
    (6021, '소금 우유 아이스크림', '#f1eee2', 'fixed'),
    (6022, '단짠팝팝 초코해변', '#8d6e63', 'seasonal'),
    (6023, '나는 딸기치오', '#ef9a9a', 'seasonal'),
    (6024, '피치 요거트', '#ffccbc', 'seasonal'),
    (6025, '메롱 멜론', '#c5e1a5', 'seasonal'),
    (6026, '(Lessly Edition) 바 베 바', '#ffe0b2', 'seasonal'),
    (6027, '쵸파의 코튼캔디 크런치', '#ce93d8', 'limited'),
    (6028, '버즈의 애플 리치 빔', '#9ccc65', 'limited'),
    (6029, '우디의 후르츠 어드벤처', '#ffb74d', 'limited'),
    (6030, '두바이에서 온 엄마는 외계인', '#6d4c41', 'limited'),
    (6031, '(Lessly Edition) 엄마는 외계인', '#7e57c2', 'special')
)
insert into flavors (id, store_id, name, color, type, available)
select catalog.id, target_store.id, catalog.name, catalog.color, catalog.type, true
from catalog cross join target_store
where not exists (
  select 1 from flavors existing
  where existing.store_id = target_store.id
    and regexp_replace(lower(existing.name), '\s+', '', 'g') = regexp_replace(lower(catalog.name), '\s+', '', 'g')
)
on conflict (id) do nothing;

with target_store as (
  select id from stores order by id limit 1
), catalog(id, name, category, subtype, par, size_label, location) as (
  values
    (610001::bigint, '원피스 보물상자 와츄원', 'cake', 'standard_cake', 2, '일반', '케이크 냉동고'),
    (610002, '거침없이 나아가는 써니호!', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610003, '새 친구 릴리패드의 등장!', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610004, '초코앤쿠키 마이원 케이크', 'cake', 'standard_cake', 2, '일반', '케이크 냉동고'),
    (610005, '바닐라베리 마이원 케이크', 'cake', 'standard_cake', 2, '일반', '케이크 냉동고'),
    (610006, '헬로키티의 스위티 데이', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610007, '넌 내꺼야! 몬스터 볼 케이크', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610008, '브이 브이 이브이 케이크', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610009, '톡톡 프루티 와츄원', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610010, '바삭 쿠키 볼 와츄원', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610011, '오로라퍼플 쿠로미', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610012, '스카이블루 시나모롤', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610013, '골든옐로우 폼폼푸린', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610014, '초코별에서 온 엄마는 외계인', 'cake', 'standard_cake', 2, '일반', '케이크 냉동고'),
    (610015, '스윗 하트 큐피드', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610016, '스윗 레드 하트', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610017, '스트로베리 요거트 프레지에', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610018, '포차코와 더 듬뿍 망고', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610019, '더 듬뿍 딸기 우유 케이크', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610020, '해-삐 잔망 루피', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610021, '진정한 티라미수 컬렉션', 'cake', 'collection_cake', 1, '컬렉션', '케이크 냉동고'),
    (610022, '진정한 초콜릿 컬렉션', 'cake', 'collection_cake', 1, '컬렉션', '케이크 냉동고'),
    (610023, '(Lessly Edition) 아몬드 봉봉 미니 케이크', 'cake', 'mini_cake', 1, '미니', '케이크 냉동고'),
    (610024, '스노우 볼 와츄원', 'cake', 'standard_cake', 1, '일반', '케이크 냉동고'),
    (610025, '골라먹는 27 큐브', 'cake', 'cube_cake', 1, '27 큐브', '케이크 냉동고'),
    (610026, '리얼 초코 27 큐브', 'cake', 'cube_cake', 1, '27 큐브', '케이크 냉동고'),
    (610027, '(Lessly Edition) 엄마는 외계인 미니 케이크', 'cake', 'mini_cake', 1, '미니', '케이크 냉동고'),
    (611001, '두바이 크런치 모찌 초코 헤이즐넛', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611002, '두쫀아 모찌 피스타치오', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611003, '아몬드봉봉모찌', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611004, '아이스 모찌 소금우유', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611005, '아이스 모찌 그린티', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611006, '아이스 모찌 스트로베리', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611007, '아이스 모찌 초코바닐라', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611008, '아이스 모찌 크림치즈', 'dessert', 'mochi', 5, '낱개', '디저트 냉동고'),
    (611101, '아이스 마카롱 크림브륄레', 'dessert', 'macaron', 5, '낱개', '디저트 냉동고'),
    (611102, '아이스 마카롱 초콜릿 무스', 'dessert', 'macaron', 5, '낱개', '디저트 냉동고'),
    (611103, '아이스 마카롱 쿠키앤크림', 'dessert', 'macaron', 5, '낱개', '디저트 냉동고'),
    (611201, '아이스크림 롤 (매장별 등록)', 'dessert', 'roll', 1, '매장 확인', '디저트 냉동고'),
    (611301, '아이스 바움쿠헨 아몬드봉봉', 'dessert', 'sandwich', 3, '낱개', '디저트 냉동고'),
    (611302, '버터 쿠키 샌드 바닐라 카라멜', 'dessert', 'sandwich', 3, '낱개', '디저트 냉동고'),
    (611303, '아이스 쿠키 샌드 바닐라', 'dessert', 'sandwich', 3, '낱개', '디저트 냉동고'),
    (611304, '아이스 모나카 쫀떡 인절미', 'dessert', 'sandwich', 3, '낱개', '디저트 냉동고'),
    (611305, '아이스 모나카 우유', 'dessert', 'sandwich', 3, '낱개', '디저트 냉동고'),
    (611401, '피카츄 스틱바 바나나우유', 'dessert', 'stick_bar', 4, '낱개', '디저트 냉동고'),
    (611402, '맥심 스틱바 슈프림골드', 'dessert', 'stick_bar', 4, '낱개', '디저트 냉동고'),
    (611403, '맥심 스틱바 모카골드 마일드', 'dessert', 'stick_bar', 4, '낱개', '디저트 냉동고'),
    (611404, '미니 아이스 스틱바 바닐라', 'dessert', 'stick_bar', 4, '낱개', '디저트 냉동고'),
    (611601, '버즈의 인피니티 파워빔 선데', 'dessert', 'sundae', 3, '낱개', '디저트 냉동고'),
    (611602, '우디의 후르츠 어드벤처 선데', 'dessert', 'sundae', 3, '낱개', '디저트 냉동고'),
    (611603, '두바이st 선데', 'dessert', 'sundae', 3, '낱개', '디저트 냉동고'),
    (611501, '블록팩 체리쥬빌레', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611502, '블록팩 슈팅스타', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611503, '블록팩 아몬드봉봉', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611504, '블록팩 엄마는외계인', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611505, '블록팩 쿠키앤크림', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611506, '블록팩 뉴욕치즈케이크', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611507, '블록팩 민트초코봉봉', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611508, '블록팩 이상한나라의솜사탕', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611509, '블록팩 바람과함께사라지다', 'dessert', 'block_pack', 3, '블록팩', '프리팩 냉동고'),
    (611701, '레디팩 체리쥬빌레', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611702, '레디팩 오레오 쿠키 앤 크림', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611703, '레디팩 엄마는 외계인', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611704, '레디팩 아몬드 봉봉', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611705, '레디팩 소금 우유', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611706, '레디팩 베리베리 스트로베리', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611707, '레디팩 민트 초콜릿 칩', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611708, '레디팩 레인보우 샤베트', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고'),
    (611709, '레디팩 31요거트', 'dessert', 'ready_pack', 3, '레디팩', '프리팩 냉동고')
)
insert into inventory_products
  (id, store_id, name, category, subtype, quantity, par, unit, size_label, location, expiry_date, pack_size, available)
select catalog.id, target_store.id, catalog.name, catalog.category, catalog.subtype,
       0, catalog.par, '개', catalog.size_label, catalog.location, null, null,
       catalog.subtype <> 'roll'
from catalog cross join target_store
where not exists (
  select 1 from inventory_products existing
  where existing.store_id = target_store.id
    and regexp_replace(lower(existing.name), '\s+', '', 'g') = regexp_replace(lower(catalog.name), '\s+', '', 'g')
)
on conflict (id) do nothing;

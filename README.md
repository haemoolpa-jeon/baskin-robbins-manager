# BR 매니저 (모노레포)

스마트폰과 태블릿에서 사용하는 한국어 우선 매장 관리 PWA 모음입니다. 재고와 근무·급여를 각각
독립적으로 배포·설치할 수 있는 별도 앱으로 분리하고, 공용 코드(Supabase 연결, 공통 UI, 매장
컨텍스트)는 `@br/shared`에서 공유합니다.

## 패키지 구성

```
packages/
  shared/     @br/shared     Supabase 클라이언트·데모 백엔드, 공통 UI(Modal/Toast/…),
                             매장 컨텍스트(AppProvider), PIN 잠금, 설정·변경기록, 공통 스타일
  inventory/  @br/inventory  재고 매니저 앱 (아이스크림·케이크·디저트·소모품·주문 준비)
  workforce/  @br/workforce  근무 매니저 앱 (근무 일정 + 한국 급여: 주휴·3.3%·실수령)
```

앱은 `@shared/*` 경로 별칭으로 공용 소스를 직접 참조합니다(별도 빌드 단계 없음). Supabase 스키마와
마이그레이션(`supabase/`)은 두 앱이 공유합니다.

## 재고 앱 관리 범위

- **아이스크림** — 캐비닛 위치/잔량, 창고 텁 수량, LOT, 소비기한, 보관 위치
- **케이크** — 일반/미니/큐브/컬렉션, 수량, 목표, 규격, 소비기한, 냉동고 위치
- **디저트** — 모찌, 마카롱, 롤, 샌드, 스틱바, 블록팩, 레디팩, 선데
- **소모품** — 컵, 뚜껑, 콘, 스푼, 용기, 쇼핑백, 냅킨, 드라이아이스, 케이크 부자재
- **주문 준비** — 종류별 목표 재고 미달 체크리스트

각 영역은 검색, 부족 필터, 빠른 실사, 추가, 수정, 사용중지, 삭제를 지원합니다.

## 개발

루트에서 `npm install` 한 번이면 워크스페이스가 모두 연결됩니다.

```bash
npm install

# 재고 앱 (@br/inventory)
npm run dev              # = dev:inventory, .env의 Supabase 사용
npm run demo             # 백엔드 없이 샘플 데이터로 실행
npm run build            # = build:inventory (Vercel 기본 배포 대상)

# 근무 앱 (@br/workforce)
npm run dev:workforce
npm run demo:workforce
npm run build:workforce

# 전체
npm run build:all        # 두 앱 모두 빌드
npm run typecheck        # 모든 워크스페이스 타입 검사
npm test                 # 모든 워크스페이스 테스트 (현재 급여 단위 테스트)
```

각 앱의 `.env` / `.env.demo`는 해당 패키지 폴더(`packages/<app>/`)에 둡니다.

## Supabase

새 설치는 `supabase/schema.sql` 다음 `supabase/seed.sql`을 실행합니다. 기존 v2 설치는 데이터를
지우는 `schema.sql` 대신 `supabase/migrations/`의 SQL을 날짜 순서로 실행하세요.

기본 메뉴 카탈로그는 2026-07-17 기준 배스킨라빈스 코리아 공개 메뉴를 바탕으로 작성했습니다.
메뉴명만 공식 자료를 따르며, 재고 수량·목표·분류·보관 위치는 매장 운영용 예시입니다. 매장별
취급 여부가 다를 수 있으므로 첫 실사 후 사용중지와 목표 수량을 조정하세요.

## OCR 확장 방향

납품서 OCR은 인식 결과를 바로 저장하지 않고, 현재 품목명과 대조한 **검토용 입고 초안**을 만드는
방식이 적합합니다. 점주가 수량과 매칭을 확인한 뒤 재고에 반영하도록 설계합니다.

## 기술 구성

- React 18, TypeScript, Vite
- Supabase Postgres
- TanStack Query
- vite-plugin-pwa

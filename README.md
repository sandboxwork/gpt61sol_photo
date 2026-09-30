# Atelier · Layer Studio

브라우저 기반 레이어 이미지 편집기 전체 소스입니다.

배포 사이트: https://sandboxwork.github.io/gpt61sol_photo/

소스 저장소: https://github.com/sandboxwork/gpt61sol_photo

## 실행

Node.js 22 이상과 npm을 준비하세요.

```sh
cd atelier
npm ci
npm run dev
```

터미널에 표시되는 주소를 브라우저에서 여세요.

## 빌드

```sh
cd atelier
npm run build
```

`atelier/dist/`에 정적 배포 파일이 생성됩니다. 웹 서버에서 제공해야 하며, index.html을 파일로 직접 열어 실행하는 방식은 지원하지 않습니다.

빌드 결과를 로컬에서 확인하려면 `atelier` 폴더에서 `npm run preview`를 실행하고, 터미널에 표시된 `/gpt61sol_photo/` 주소를 여세요.

## GitHub Pages 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 Node.js 22에서 의존성을 설치하고 기존 검증 코드를 실행한 뒤 빌드 결과를 GitHub Pages에 배포합니다. GitHub의 Actions 탭에서 수동 실행도 가능합니다. 배포에는 자동으로 제공되는 `GITHUB_TOKEN`을 사용하며 별도의 PAT 저장은 필요하지 않습니다.

저장소의 Settings → Pages → Build and deployment → Source는 **GitHub Actions**로 설정합니다. `atelier/vite.config.js`의 `base`는 저장소 경로인 `/gpt61sol_photo/`입니다. 저장소 이름이나 배포 경로를 변경하면 이 값도 수정해야 합니다.

## 구성

- `atelier/src/main.js`: 편집 UI, 도구 조작, 저장·복원·내보내기
- `atelier/src/engine.js`: 레이어, 합성, 마스크, 변형, PSD 가져오기
- `atelier/src/worker.js`: PSD 해석, 색상 보정, 필터, 채우기
- `atelier/src/style.css`: 다크 편집 작업 공간
- `atelier/index.html`: 진입 페이지
- `atelier/package.json`, `package-lock.json`: 실행 스크립트와 의존성
- `atelier/vite.config.js`: GitHub Pages 배포 경로 설정
- `atelier/dist/`: 로컬 빌드 결과 (Git 추적 제외)
- `.github/workflows/deploy.yml`: 검증·빌드·배포 자동화
- `qa/`: 픽셀 처리 및 UI 이벤트 검증 코드

소스와 실행 설정, 잠금 파일, 검증 코드를 저장소에 포함합니다. 설치된 의존성, 임시 파일, 로컬 호스팅 설정은 제외하며, 배포 결과는 GitHub Actions에서 생성합니다.

## 검증 코드 실행

먼저 atelier에서 npm ci를 실행한 다음:

```sh
cd qa
npm ci
node order-check.mjs
node ui-check.mjs
```

이 검증은 네이티브 Canvas 픽셀 비교와 DOM 이벤트 시뮬레이션을 사용합니다. 실제 브라우저 E2E 테스트는 별도입니다. 검증 실행 시 qa에 임시 파일과 샘플 PNG가 생성될 수 있습니다.

## 저장 및 PSD 지원

이미지는 브라우저에서 처리되며 자동 저장은 현재 브라우저의 IndexedDB에 보관됩니다. `.atelier` 프로젝트 파일을 저장하면 레이어·마스크·필터를 다른 환경으로 옮길 수 있습니다.

PSD의 레이어 이름·순서·그룹·불투명도·블렌딩·마스크·텍스트 정보를 가능한 범위에서 유지합니다. 스마트 오브젝트와 일부 Photoshop 전용 효과는 원본 PSD 및 메타데이터로 보존되며 완전한 Photoshop 호환은 아닙니다.

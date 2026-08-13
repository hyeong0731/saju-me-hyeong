# saju-me

이름과 생시만 알려 주면 사주를 읽어 주는 웹 서비스입니다. Google 계정으로 로그인하면 해석을 저장하고, 언제든 다시 보거나 링크로 공유할 수 있습니다.

**Live:** [https://saju-me-hyeong.vercel.app](https://saju-me-hyeong.vercel.app)

## 기능

- Google 로그인 (Supabase Auth)
- 첫 로그인 시 이름·생년월일·태어난 시간·성별·양력/음력 온보딩
- Gemini로 사주 해석 생성
- 해석 기록 저장, 다시 보기, 수정, 삭제
- 공유 링크로 해석 전달
- Google Analytics 4 화면·이벤트 추적

## 스택

- React 19, Vite
- Supabase (Auth, Postgres)
- Google Gemini (`gemini-3.6-flash`)
- Google Analytics 4
- Vercel

## 로컬 실행

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 아래 값을 채웁니다.

```
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- Gemini 키: [Google AI Studio](https://aistudio.google.com/apikey)
- Supabase URL / publishable key: [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

Google 로그인을 쓰려면 Supabase Authentication에서 Google provider를 켜고, Redirect URL에 `http://localhost:5173`을 추가하세요.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | oxlint |

## 프로젝트 구조

```
src/
  components/   UI (로그인, 프로필, 해석, 공유)
  hooks/        인증·앱 상태
  lib/          Gemini, Supabase, 분석, 사주 프롬프트
  styles/       화면별 CSS
```

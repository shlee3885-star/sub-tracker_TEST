(function (global) {
  const categoryColors = {
    '영상': '#6978ff',
    '음악': '#9b7bff',
    '운동': '#23b58d',
    '생산성': '#ffb84c',
    '기타': '#a3adba'
  };

  // formatMoney(value)
  // 숫자 값을 한국 원화 표기법으로 변환해 사용자 친화적인 금액 문자열을 만든다.
  // Intl.NumberFormat을 사용해 통화 단위와 소수점 제거 정책을 일관되게 적용한다.
  function formatMoney(value) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  }

  // formatType(type)
  // 구독의 결제 cycle 값을 화면에 보여줄 수 있는 한글 문구로 바꾼다.
  // yearly이면 '연간', 그 외에는 대표적으로 '월간'으로 해석한다.
  function formatType(type) {
    return type === 'yearly' ? '연간' : '월간';
  }

  // formatDays(dayCount)
  // 남은 결제일까지의 일수 값을 D-Day, D+n, D-n 형식의 문자열로 표현한다.
  // 0이면 오늘 결제, 음수면 이미 결제일이 지난 상태, 양수면 아직 남은 일수다.
  function formatDays(dayCount) {
    if (dayCount === 0) return 'D-Day';
    if (dayCount < 0) return `D+${Math.abs(dayCount)}`;
    return `D-${dayCount}`;
  }

  // renderSubscriptionList(subscriptions)
  // 구독 배열을 순회하면서 HTML 카드 형태의 구독 목록 문자열을 생성해 실제 DOM의 list.innerHTML에 넣는다.
  // 데이터가 비어 있으면 빈 목록 안내를 보여주고, 구독 카드에는 이름, 카테고리, 결제주기, 월 비용, D-Day 상태, 수정/삭제 버튼이 포함된다.
  function renderSubscriptionList(subscriptions) {
    const list = global.document.getElementById('subscription-list');
    const empty = global.document.getElementById('empty-list');

    if (!subscriptions.length) {
      empty.style.display = 'flex';
      list.innerHTML = '';
      return;
    }

    if (empty) empty.style.display = 'none';

    const today = getTodayString();

    list.innerHTML = subscriptions.map((sub) => {
      const monthCost = convertToMonthlyAmount(sub);
      const days = getDaysUntilPayment(today, sub.nextPaymentDate);
      const urgent = days >= 0 && days <= 7;
      const icon = firstLetter(sub.name);

      return `<article class="subscription-card" data-id="${sub.id}">
        <div class="subscription-left">
          <span class="subscription-icon">${icon}</span>
          <div>
            <div class="subscription-name">${escapeHTML(sub.name)}</div>
            <div class="subscription-meta">
              <span class="category-badge">${escapeHTML(sub.category || '기타')}</span>
              <span>${formatType(sub.cycle)}</span>
            </div>
          </div>
        </div>
        <div class="subscription-price">${formatMoney(monthCost)}</div>
        <div class="dday-box ${urgent ? 'urgent' : ''}">${formatDays(days)}</div>
        <div class="card-actions">
          <button class="edit-button" data-action="edit" data-id="${sub.id}">수정</button>
          <button class="delete-button" data-action="delete" data-id="${sub.id}">삭제</button>
        </div>
      </article>`;
    }).join('');
  }

  // renderSummary(subscriptions)
  // 월간 총액, 연간 총액, 그리고 7일 이내 결제 예정 구독 수를 계산해서 화면의 요약 영역 문구와 숫자를 갱신한다.
  // 또한 해당 주기에 결제될 구독 이름 목록을 "결제 예정 없음" 또는 이름 문자열로 출력한다.
  function renderSummary(subscriptions) {
    const monthlyTotal = calculateTotalMonthlyAmount(subscriptions);
    const yearlyTotal = calculateTotalYearlyAmount(subscriptions);
    const today = getTodayString();
    const upcoming = filterUpcomingPayments(subscriptions, today, 7);

    document.getElementById('monthly-total').textContent = formatMoney(monthlyTotal);
    document.getElementById('yearly-total').textContent = formatMoney(yearlyTotal);
    document.getElementById('week-total').textContent = `${upcoming.length}건`;

    if (upcoming.length === 0) {
      document.getElementById('week-list').textContent = '결제 예정 없음';
    } else {
      document.getElementById('week-list').textContent = upcoming.map((sub) => sub.name).join(', ');
    }
  }

  // renderCategoryChart(subscriptions)
  // 카테고리별 지출 비중을 계산하고, 카테고리 이름, 색상, 막대 너비 비율을 엮어 차트 HTML을 생성한다.
  // total이 0이거나 구독 데이터가 없으면 '카테고리 없음' 상태 표시를 그린다.
  function renderCategoryChart(subscriptions) {
    const chart = document.getElementById('category-chart');
    const totals = groupByCategory(subscriptions);
    const categoryNames = Object.keys(totals);
    const total = calculateTotalMonthlyAmount(subscriptions);

    if (!categoryNames.length || total === 0) {
      chart.innerHTML = `<div class="empty-list"><span class="empty-icon">+</span><span>카테고리 없음</span></div>`;
      return;
    }

    const rows = categoryNames.map((category) => {
      const categoryTotal = totals[category];
      const percent = Math.round((categoryTotal / total) * 100);
      const color = categoryColors[category] || '#6978ff';

      return `<div class="chart-row">
        <span class="chart-label">${escapeHTML(category)}</span>
        <span class="chart-bar-wrap">
          <span class="chart-bar" style="width:${Math.max(percent, 3)}%;background:${color};"></span>
        </span>
        <span class="chart-value">${percent}%</span>
      </div>`;
    }).join('');

    chart.innerHTML = rows;
  }

  // renderAll(subscriptions)
  // 요약, 구독 목록, 카테고리 차트 3가지를 한 번에 실행해 화면 전체를 새로 그리는 통합 렌더 함수다.
  // main.js의 render()에서 호출되며, subs 데이터가 변경될 때마다 화면 상태를 일관되게 맞춘다.
  function renderAll(subscriptions) {
    renderSummary(subscriptions);
    renderSubscriptionList(subscriptions);
    renderCategoryChart(subscriptions);
  }

  // firstLetter(text)
  // 구독 이름의 첫 글자를 추출해 카드 아이콘으로 사용할 대문자 영문자를 만든다.
  // 이름이 비어 있으면 기본값 S로 시작 문자를 지정해 UI가 깨지지 않게 한다.
  function firstLetter(text) {
    return String(text || 'S').trim().charAt(0).toUpperCase();
  }

  // escapeHTML(text)
  // 사용자 입력 문자열이 HTML로 해석되어 화면에 그대로 들어가는 것을 방지한다.
  // &, <, >, " , ' 문자를 HTML 엔티티로 변환해 XSS 방지와 안전한 텍스트 표시를 수행한다.
  function escapeHTML(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // getTodayString()
  // 오늘 날짜를 YYYY-MM-DD 형식의 문자열로 반환한다.
  // 날짜 계산 및 디데이 표시를 위해 날짜 비교 함수에서 공통적으로 사용되는 기준값을 만든다.
  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  global.SubTrackerUI = {
    renderAll,
    renderSubscriptionList,
    renderSummary,
    renderCategoryChart,
    formatMoney,
    formatDays
  };
})(window);

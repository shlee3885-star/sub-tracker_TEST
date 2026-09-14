(function (global) {
  const storageKey = 'sub-tracker-data-v1';
  const form = global.document.getElementById('subscription-form');
  const idInput = global.document.getElementById('subscription-id');
  const nameInput = global.document.getElementById('subscription-name');
  const categoryInput = global.document.getElementById('category');
  const paymentMethodInput = global.document.getElementById('payment-method');
  const amountInput = global.document.getElementById('amount');
  const cycleInput = global.document.getElementById('cycle');
  const dateInput = global.document.getElementById('next-payment-date');
  const submitButton = global.document.getElementById('submit-button');
  const formHeading = global.document.getElementById('form-heading');
  const cancelEditButton = global.document.getElementById('cancel-edit');
  const addTopButton = global.document.getElementById('add-top-button');
  const toast = global.document.getElementById('toast');

  let subs = [];

  // buildTodayDate(offset)
  // 기준일인 오늘 날짜를 기준으로 offset만큼 이동한 날짜 문자열을 반환한다.
  // offset이 1이면 내일, -1이면 어제를 의미하며, YYYY-MM-DD 형식으로 맞춘다.
  // 이 함수는 초기 예시 데이터와 폼의 기본 결제일 초기값을 만들 때 사용된다.
  function buildTodayDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  // defaultSubscriptions()
  // 앱을 처음 실행할 때 보여줄 기본 구독 데이터 예시 배열을 생성한다.
  // 각 항목은 id, name, amount, cycle, nextPaymentDate, category, paymentMethod 정보를 가진 객체다.
  // 사용자가 저장된 데이터가 없을 때 이 데이터가 localStorage에 복원용으로 저장된다.
  function defaultSubscriptions() {
    return [
      {
        id: 'sub_1',
        name: '넷플릭스',
        amount: 13500,
        cycle: 'monthly',
        nextPaymentDate: buildTodayDate(2),
        category: '영상',
        paymentMethod: '신한카드'
      },
      {
        id: 'sub_2',
        name: '스포티파이',
        amount: 10900,
        cycle: 'monthly',
        nextPaymentDate: buildTodayDate(6),
        category: '음악',
        paymentMethod: '삼성카드'
      },
      {
        id: 'sub_3',
        name: '헬스장',
        amount: 45000,
        cycle: 'monthly',
        nextPaymentDate: buildTodayDate(12),
        category: '운동',
        paymentMethod: '현대카드'
      },
      {
        id: 'sub_4',
        name: '클라우드',
        amount: 120000,
        cycle: 'yearly',
        nextPaymentDate: buildTodayDate(20),
        category: '생산성',
        paymentMethod: '카카오페이'
      }
    ];
  }

  // loadData()
  // 브라우저의 localStorage에 저장된 구독 목록을 읽어와서 전역 변수 subs에 채운다.
  // 저장된 데이터가 없거나 손상된 JSON이면 기본 예시 데이터로 복구하고,
  // 데이터 일관성을 위해 다시 저장한다.
  function loadData() {
    try {
      const saved = global.localStorage.getItem(storageKey);
      if (!saved) {
        subs = defaultSubscriptions();
        saveData();
        return;
      }
      const data = JSON.parse(saved);
      if (!Array.isArray(data)) {
        subs = defaultSubscriptions();
      } else {
        subs = data;
      }
    } catch (error) {
      console.warn('localStorage data error:', error);
      subs = defaultSubscriptions();
    }
  }

  // saveData()
  // 메모리에 있는 구독 배열 subs를 JSON 문자열로 바꿔 storageKey 이름으로 localStorage에 저장한다.
  // 이렇게 저장된 데이터는 새로고침 후에도 앱에서 복원된다.
  function saveData() {
    global.localStorage.setItem(storageKey, JSON.stringify(subs));
  }

  // showToast(message)
  // 사용자에게 입력 성공, 수정, 삭제 또는 입력 누락 같은 메시지를 토스트 UI로 보여준다.
  // toast DOM 요소를 보이게 하고 1.5초 뒤에는 자동으로 사라지게 한다.
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 1500);
  }

  // resetForm()
  // 폼의 입력 요소를 공통 기본값으로 되돌리고, 추가 모드와 수정 모드 UI 문구를 초기화한다.
  // 이름, 카테고리, 결제 주기, 기본 금액, 다음 결제일까지 초기화해 사용자가 새 구독을 빠르게 추가할 수 있게 한다.
  function resetForm() {
    form.reset();
    formHeading.textContent = '구독 추가';
    submitButton.textContent = '추가하기';
    idInput.value = '';
    categoryInput.value = '영상';
    cycleInput.value = 'monthly';
    amountInput.value = 1000;
    dateInput.value = buildTodayDate(1);
  }

  // handleFormSubmit(event)
  // 폼 submit 이벤트가 발생하면 입력된 구독 정보를 검증하고,
  // id가 있으면 그 항목을 수정하고 없으면 새 구독을 배열에 추가한다.
  // 이후 저장, 렌더링, 폼 초기화까지 한 번에 처리한다.
  function handleFormSubmit(event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const paymentMethod = paymentMethodInput.value.trim();
    const amount = Number(amountInput.value);
    const cycle = cycleInput.value;
    const nextPaymentDate = dateInput.value;

    if (!name || !category || !nextPaymentDate || !Number.isFinite(amount) || amount < 0) {
      showToast('필수 값을 입력해주세요.');
      return;
    }

    const id = idInput.value || makeId();

    const sub = {
      id,
      name,
      category,
      paymentMethod,
      amount,
      cycle,
      nextPaymentDate
    };

    const index = subs.findIndex((item) => item.id === id);

    if (index >= 0) {
      subs[index] = sub;
      showToast('구독이 수정되었습니다.');
    } else {
      subs.push(sub);
      showToast('구독이 추가되었습니다.');
    }

    saveData();
    render();
    resetForm();
  }

  // makeId()
  // 새 구독 항목에 고유한 id를 생성한다.
  // Date.now()와 난수 조합을 사용해 충돌 가능성을 낮추고,
  // 저장소에서 수정과 삭제를 식별하는 기준으로 사용한다.
  function makeId() {
    return `sub_${Date.now()}_${Math.round(Math.random() * 1000)}`;
  }

  // handleListClick(event)
  // 구독 카드의 수정/삭제 버튼 클릭 이벤트를 처리한다.
  // event.target.closest('button[data-action]')로 액션 버튼을 찾고,
  // data-action 값이 delete라면 목록에서 삭제하고, edit라면 해당 구독을 폼으로 불러와 수정 모드로 전환한다.
  function handleListClick(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');

    if (action === 'delete') {
      subs = subs.filter((item) => item.id !== id);
      saveData();
      render();
      showToast('구독이 삭제되었습니다.');
    }

    if (action === 'edit') {
      const sub = subs.find((item) => item.id === id);
      if (!sub) return;

      idInput.value = sub.id;
      nameInput.value = sub.name;
      categoryInput.value = sub.category || '영상';
      paymentMethodInput.value = sub.paymentMethod || '';
      amountInput.value = String(sub.amount);
      cycleInput.value = sub.cycle;
      dateInput.value = sub.nextPaymentDate;

      formHeading.textContent = '구독 수정';
      submitButton.textContent = '수정하기';
      nameInput.focus();
    }
  }

  // render()
  // subs 배열을 UI 렌더러에게 넘겨 전체 화면을 갱신한다.
  // 렌더링 로직은 ui.js의 SubTrackerUI.renderAll()에서 담당하고,
  // main.js의 역할은 데이터와 사용자 이벤트를 조립하는 중심점이다.
  function render() {
    if (global.SubTrackerUI) {
      global.SubTrackerUI.renderAll(subs);
    }
  }

  // init()
  // 앱의 초기 상태를 설정한다.
  // 저장 데이터를 읽고, 기본 선택값을 폼에 넣고, 이벤트 리스너를 연결한 뒤,
  // 첫 렌더링을 수행하여 화면을 제일 처음 보이게 만든다.
  function init() {
    loadData();
    form.reset();
    categoryInput.value = '영상';
    cycleInput.value = 'monthly';
    dateInput.value = buildTodayDate(1);
    amountInput.value = 1000;

    render();

    form.addEventListener('submit', handleFormSubmit);
    global.document.getElementById('subscription-list').addEventListener('click', handleListClick);
    cancelEditButton.addEventListener('click', () => {
      resetForm();
      showToast('입력이 취소되었습니다.');
    });
    addTopButton.addEventListener('click', () => {
      resetForm();
      nameInput.focus();
    });
  }

  init();
})(window);

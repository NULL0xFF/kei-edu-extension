// src/scripts/solution.js
import {search, updateAll} from './course';
import {updateMembers} from './member';

// Check if the current URL matches the member list page
if (window.location.href.includes('user/member/memberList.do')) {
  const btnRightArea = document.getElementsByClassName('btn_rightArea');
  if (btnRightArea.length > 0) {
    // Create the Statistics button
    const statisticButton = document.createElement('button');
    statisticButton.title = '통계';
    statisticButton.innerHTML = '<span class="txt_white">통계</span>';
    statisticButton.className = 'btn nor btn-blue';
    statisticButton.onclick = async function () {
      const input = prompt('Enter search keyword', '');
      const start = prompt('Enter start date (yyyy-MM-dd)', '2024-01-01');
      const end = prompt('Enter end date (yyyy-MM-dd)', '2024-12-31');
      if (!start || !end) {
        alert('Invalid input');
        return;
      }
      statisticButton.disabled = true;
      statisticButton.innerHTML = '<span class="txt_white">진행중...</span>';
      await search(input, start, end);
      statisticButton.innerHTML = '<span class="txt_white">완료</span>';
      statisticButton.disabled = false;
    };

    // Create the Update button
    const updateButton = document.createElement('button');
    updateButton.title = '업데이트';
    updateButton.innerHTML = '<span class="txt_white">업데이트</span>';
    updateButton.className = 'btn nor btn-gray';
    updateButton.onclick = async function () {
      updateButton.disabled = true;
      updateButton.innerHTML = '<span class="txt_white">회원 진행중...</span>';
      await updateMembers();
      updateButton.innerHTML = '<span class="txt_white">과정 진행중...</span>';
      await updateAll();
      updateButton.innerHTML = '<span class="txt_white">완료</span>';
      updateButton.disabled = false;
    };

    // Append buttons to the page
    btnRightArea[0].appendChild(statisticButton);
    btnRightArea[0].appendChild(updateButton);
  } else {
    console.error('Failed to find the button area.');
  }
}

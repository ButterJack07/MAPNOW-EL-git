// ==================== 地区选择面板 ====================

function editRegion() {
    const modal = document.createElement('div');
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
        `;

    modal.innerHTML = `
    <div class="region-modal-content" style="
        background: var(--card-bg);
        border-radius: 16px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
    ">
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        ">
            <h3 style="font-size: 18px; font-weight: 600; color: var(--text-primary);">选择地区</h3>
            <button onclick="this.closest('.region-modal-content').parentElement.remove()"
                    style="
                        width: 30px;
                        height: 30px;
                        border: none;
                        background: var(--bg-secondary);
                        border-radius: 50%;
                        font-size: 18px;
                        cursor: pointer;
                        color: var(--text-secondary);
                    ">×</button>
        </div>

        <div style="
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            color: var(--text-primary);
        ">
            <span style="color: var(--text-tertiary);">当前：</span>
            <span id="selectedRegion">${escapeHtml(currentRegion) || '未选择'}</span>
        </div>

        <div style="margin-bottom: 20px;">
            <input type="text" id="regionSearchInput"
                   placeholder="搜索省份或城市..."
                   style="
                       width: 100%;
                       padding: 10px 12px;
                       border: 1px solid #ddd;
                       border-radius: 6px;
                       font-size: 14px;
                       outline: none;
                   "
                   oninput="searchRegion(this.value)">
        </div>

        <div id="provinceList" style="margin-bottom: 16px;">
            <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 10px;">省份</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="provinceContainer">
                <div style="grid-column: span 2; text-align: center; padding: 30px; color: var(--text-tertiary);">加载中...</div>
            </div>
        </div>

        <div id="cityList" style="display: none; margin-bottom: 16px;">
            <div style="margin-bottom: 10px;">
                <button onclick="backToProvinceList()"
                        style="
                            background: none;
                            border: none;
                            color: var(--primary-color);
                            font-size: 13px;
                            padding: 0;
                            cursor: pointer;
                        ">
                    ← 返回省份
                </button>
                <span style="margin-left: 10px; font-size: 13px; color: var(--text-primary);" id="selectedProvinceName"></span>
            </div>
            <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 10px;">城市</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="cityContainer"></div>
        </div>

        <div id="searchResultList" style="display: none; max-height: 300px; overflow-y: auto;"></div>
    </div>
        `;

    document.body.appendChild(modal);
    loadProvinces();
}

function loadProvinces() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify({
        type: 'getProvinces'
    }));
}

function handleProvincesResult(provinces) {
    const container = document.getElementById('provinceContainer');
    if (!container) return;

    if (provinces.length === 0) {
        container.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: var(--text-tertiary);">暂无数据</div>';
        return;
    }

    container.innerHTML = provinces.map(province => `
    <div onclick="selectProvince(${province.id}, '${province.name}')"
         style="
            padding: 10px;
            background: #f5f5f5;
            border-radius: 6px;
            text-align: center;
            cursor: pointer;
            font-size: 14px;
            color: #333333;
            font-weight: 500;
            transition: all 0.2s;
            border: 1px solid transparent;
         "
         onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#667eea';"
         onmouseout="this.style.background='#f5f5f5'; this.style.borderColor='transparent';">
        ${province.name}
    </div>
        `).join('');
}

function selectProvince(provinceId, provinceName) {
    currentProvinceId = provinceId;
    selectedProvince = provinceName;

    document.getElementById('provinceList').style.display = 'none';
    document.getElementById('cityList').style.display = 'block';
    document.getElementById('searchResultList').style.display = 'none';
    document.getElementById('regionSearchInput').value = '';

    document.getElementById('selectedProvinceName').innerHTML = `<span style="font-weight: 600; color: var(--text-primary);">${provinceName}</span>`;

    const cityContainer = document.getElementById('cityContainer');
    cityContainer.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: var(--text-tertiary);">加载中...</div>';

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'getCitiesByProvince',
            provinceId: provinceId
        }));
    }
}

function handleCitiesResult(provinceId, cities) {
    const cityContainer = document.getElementById('cityContainer');
    if (!cityContainer) return;

    if (cities.length === 0) {
        cityContainer.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: var(--text-tertiary);">暂无城市</div>';
        return;
    }

    cityContainer.innerHTML = cities.map(city => `
    <div onclick="selectCity('${city.name}')"
         class="city-item"
         data-city="${city.name}"
         style="
            padding: 10px;
            background: #f5f5f5;
            border-radius: 6px;
            text-align: center;
            cursor: pointer;
            font-size: 13px;
            color: var(--text-primary);
            transition: background 0.2s;
         "
         onmouseover="this.style.background='#e0e0e0'"
         onmouseout="this.style.background='#f5f5f5'">
        ${city.name}
    </div>
        `).join('');
}

function selectCity(cityName) {
    selectedCity = cityName;

    document.querySelectorAll('.city-item').forEach(item => {
        if (item.getAttribute('data-city') === cityName) {
            item.style.background = 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)';
            item.style.color = 'white';
            item.style.borderColor = '#667eea';
        } else {
            item.style.background = '#f8f9fa';
            item.style.color = '#333';
            item.style.borderColor = '#e0e0e0';
        }
    });

    const fullRegion = `${selectedProvince} ${cityName}`;
    window.selectedRegion = fullRegion;
    document.getElementById('selectedRegion').textContent = fullRegion;

    if (fullRegion !== currentUser.region) {
        const modal = document.querySelector('.region-modal-content');
        if (modal) {
            updateUserInfo('region', fullRegion);
            const modalParent = modal.closest('.region-modal-content').parentElement;
            if (modalParent) {
                modalParent.remove();
            }
        }
    }
}

function backToProvinceList() {
    document.getElementById('provinceList').style.display = 'block';
    document.getElementById('cityList').style.display = 'none';
    document.getElementById('searchResultList').style.display = 'none';
    document.getElementById('regionSearchInput').value = '';
    selectedCity = '';
}

let searchTimeout = null;
function searchRegion(keyword) {
    clearTimeout(searchTimeout);

    if (!keyword.trim()) {
        document.getElementById('provinceList').style.display = 'block';
        document.getElementById('cityList').style.display = 'none';
        document.getElementById('searchResultList').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        document.getElementById('provinceList').style.display = 'none';
        document.getElementById('cityList').style.display = 'none';
        document.getElementById('searchResultList').style.display = 'block';

        const resultContainer = document.getElementById('searchResultList');
        resultContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-tertiary);">搜索中...</div>';

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'searchCities',
                keyword: keyword
            }));
        }
    }, 300);
}

function handleSearchResults(results) {
    const resultContainer = document.getElementById('searchResultList');
    if (!resultContainer) return;

    if (results.length === 0) {
        resultContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8; font-size: 14px;">未找到相关地区</div>';
        return;
    }

    resultContainer.innerHTML = results.map(item => `
    <div onclick="selectSearchResult('${item.province_name}', '${item.name}')"
         style="
            padding: 16px;
            margin-bottom: 8px;
            background: #f8fafc;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #e2e8f0;
            font-family: inherit;
         "
         onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#667eea'; this.style.transform='translateX(4px)'"
         onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='translateX(0)'">
        <div style="font-weight: 600; color: #1e293b; font-size: 15px; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 13px; color: #64748b;">${item.province_name}</div>
    </div>
        `).join('');
}

function selectSearchResult(provinceName, cityName) {
    selectedProvince = provinceName;
    selectedCity = cityName;

    const fullRegion = `${provinceName} ${cityName}`;
    window.selectedRegion = fullRegion;
    document.getElementById('selectedRegion').textContent = fullRegion;

    document.getElementById('regionSearchInput').value = '';
    document.getElementById('provinceList').style.display = 'block';
    document.getElementById('cityList').style.display = 'none';
    document.getElementById('searchResultList').style.display = 'none';
}
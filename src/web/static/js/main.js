// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 初始化页面
    initPage();

    // 绑定事件
    bindEvents();

    // 初始化广告/宣传区域
    initAnnouncements();
});

// 初始化页面
function initPage() {
    // 获取验证码
    refreshCaptcha();

    // 填充周次选择
    const weekSelect = document.getElementById('week');
    for (let i = 1; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第${i}周`;
        weekSelect.appendChild(option);
    }

    // 获取当前学期
    fetchCurrentTerm()
        .then(term => {
            // 获取当前周次和星期
            fetchCurrentWeekDay(term);
        });

    // 获取教学楼列表
    fetchBuildings();

    // 检查登录状态
    checkLoginStatus();
}

// 获取教学楼列表
function fetchBuildings() {
    fetch('/api/classrooms')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const buildingDatalist = document.getElementById('building-list');

                // 清空现有选项
                buildingDatalist.innerHTML = '';

                // 添加教学楼选项
                const buildings = Object.keys(data.data).sort((a, b) => {
                    // 将纯字母的教学楼排在前面
                    const aIsLetter = /^[A-Za-z]+$/.test(a);
                    const bIsLetter = /^[A-Za-z]+$/.test(b);
                    if (aIsLetter && !bIsLetter) return -1;
                    if (!aIsLetter && bIsLetter) return 1;
                    return a.localeCompare(b);
                });

                buildings.forEach(building => {
                    const option = document.createElement('option');
                    const roomCount = data.data[building].length;
                    option.value = building;
                    option.label = `${building} (${roomCount}间)`;
                    buildingDatalist.appendChild(option);
                });

                // 添加输入框事件监听
                const buildingInput = document.getElementById('free-building');
                buildingInput.addEventListener('input', function () {
                    // 转换输入值为大写
                    this.value = this.value.toUpperCase();
                });
            }
        })
        .catch(error => {
            console.error('获取教学楼列表失败:', error);
        });
}

// 获取当前学期
function fetchCurrentTerm() {
    return fetch('/get_current_term')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const xnxqhSelect = document.getElementById('xnxqh');

                // 清空现有选项
                xnxqhSelect.innerHTML = '';

                // 生成学期列表（前后各两个学期）
                const [year1, year2, term] = data.current_term.split('-');
                const baseYear = parseInt(year1);

                // 创建学期列表数组
                let termsList = [];

                // 添加当前学期
                termsList.push({
                    value: data.current_term,
                    text: `${data.current_term} (当前学期)`,
                    isCurrent: true,
                    sortKey: `${year1}-${year2}-${term}`
                });

                // 前两个学期
                for (let i = 1; i <= 2; i++) {
                    let prevYear1, prevYear2, prevTerm;

                    if (term === '1') {
                        prevYear1 = baseYear - Math.ceil(i / 2);
                        prevYear2 = baseYear - Math.ceil(i / 2) + 1;
                        prevTerm = i % 2 === 0 ? '1' : '2';
                    } else {
                        prevYear1 = baseYear - Math.ceil(i / 2);
                        prevYear2 = baseYear - Math.ceil(i / 2) + 1;
                        prevTerm = i % 2 === 1 ? '1' : '2';
                    }

                    const prevTermValue = `${prevYear1}-${prevYear2}-${prevTerm}`;
                    termsList.push({
                        value: prevTermValue,
                        text: prevTermValue,
                        isCurrent: false,
                        sortKey: `${prevYear1}-${prevYear2}-${prevTerm}`
                    });
                }

                // 后两个学期
                for (let i = 1; i <= 2; i++) {
                    let nextYear1, nextYear2, nextTerm;

                    if (term === '1') {
                        nextYear1 = baseYear + Math.floor(i / 2);
                        nextYear2 = baseYear + Math.floor(i / 2) + 1;
                        nextTerm = i % 2 === 1 ? '2' : '1';
                    } else {
                        nextYear1 = baseYear + Math.ceil(i / 2);
                        nextYear2 = baseYear + Math.ceil(i / 2) + 1;
                        nextTerm = i % 2 === 1 ? '1' : '2';
                    }

                    const nextTermValue = `${nextYear1}-${nextYear2}-${nextTerm}`;
                    termsList.push({
                        value: nextTermValue,
                        text: nextTermValue,
                        isCurrent: false,
                        sortKey: `${nextYear1}-${nextYear2}-${nextTerm}`
                    });
                }

                // 按时间顺序排序（从早到晚）
                termsList.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

                // 将排序后的学期添加到下拉框
                termsList.forEach(termItem => {
                    const option = document.createElement('option');
                    option.value = termItem.value;
                    option.textContent = termItem.text;
                    option.selected = termItem.isCurrent;
                    xnxqhSelect.appendChild(option);
                });

                // 立即获取当前周次和星期
                fetchCurrentWeekDay(data.current_term);

                return data.current_term;
            }
            return null;
        })
        .catch(error => {
            console.error('获取当前学期失败:', error);
            return null;
        });
}

// 获取当前周次和星期
function fetchCurrentWeekDay(term) {
    if (!term) return;

    fetch(`/get_current_week_day?term=${term}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 更新周次选择框
                const weekSelect = document.getElementById('week');
                const freeWeekSelect = document.getElementById('free-week');

                // 清空现有选项
                weekSelect.innerHTML = '';
                if (freeWeekSelect) {
                    freeWeekSelect.innerHTML = '';
                }

                // 添加周次选项
                for (let i = 1; i <= 20; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = `第${i}周`;

                    // 设置当前周为默认选中
                    if (i === data.current_week) {
                        option.selected = true;
                    }

                    weekSelect.appendChild(option);

                    // 同时更新空闲教室查询的周次选择框
                    if (freeWeekSelect) {
                        const freeOption = option.cloneNode(true);
                        // 确保空闲教室查询的周次选择框也默认选中当前周次
                        if (i === data.current_week) {
                            freeOption.selected = true;
                        }
                        freeWeekSelect.appendChild(freeOption);
                    }
                }

                // 更新星期选择框
                const daySelect = document.getElementById('day');
                const freeDaySelect = document.getElementById('free-day');

                // 设置当前星期为默认选中
                if (daySelect) {
                    for (let i = 0; i < daySelect.options.length; i++) {
                        if (daySelect.options[i].value == data.current_day) {
                            daySelect.options[i].selected = true;
                            break;
                        }
                    }
                }

                // 同时更新空闲教室查询的星期选择框
                if (freeDaySelect) {
                    for (let i = 0; i < freeDaySelect.options.length; i++) {
                        if (freeDaySelect.options[i].value == data.current_day) {
                            freeDaySelect.options[i].selected = true;
                            break;
                        }
                    }
                }

                // 显示当前周次和星期的提示
                const weekInfo = document.getElementById('week-info');
                const weekDayInfo = document.getElementById('week-day-info');
                if (weekInfo) {
                    weekInfo.style.display = 'block';
                }
                if (weekDayInfo) {
                    weekDayInfo.textContent = `当前是第${data.current_week}周，星期${getDayName(data.current_day)}`;
                }
            }
        })
        .catch(error => {
            console.error('获取当前周次和星期失败:', error);
        });
}

// 获取星期几的名称
function getDayName(day) {
    const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
    return dayNames[day - 1] || '';
}

// 初始化广告/宣传区域
function initAnnouncements() {
    // 处理公告折叠状态
    const announcementContent = document.getElementById('announcement-content');
    const announcementToggle = document.querySelector('.announcement-toggle');

    if (announcementContent && announcementToggle) {
        announcementContent.addEventListener('show.bs.collapse', function () {
            announcementToggle.style.transform = 'rotate(0deg)';
        });

        announcementContent.addEventListener('hide.bs.collapse', function () {
            announcementToggle.style.transform = 'rotate(180deg)';
        });
    }

    // 加载公告内容
    loadAnnouncementContent();
}

// 加载公告内容
function loadAnnouncementContent() {
    fetch('/api/announcements')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 渲染顶部公告
                const topAnnouncement = data.data.top;
                if (topAnnouncement) {
                    renderAnnouncement(topAnnouncement);
                }

                // 渲染底部工具栏
                const bottomAnnouncement = data.data.bottom;
                if (bottomAnnouncement) {
                    renderBottomTools(bottomAnnouncement);
                }
            }
        })
        .catch(error => {
            console.error('获取公告内容失败:', error);
            const announcementContent = document.getElementById('announcement-content');
            if (announcementContent) {
                announcementContent.innerHTML = '<div class="alert alert-danger">获取公告内容失败，请稍后再试。</div>';
            }
        });
}

// 渲染公告
function renderAnnouncement(announcement) {
    const announcementContent = document.querySelector('#announcement-content .card-body');
    if (!announcementContent) return;

    // 更新标题
    const headerTitle = document.querySelector('#announcement-card .card-header h5');
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fas fa-bullhorn me-2"></i>${announcement.title || '公告'}`;
    }

    // 构建公告内容
    const content = announcement.content;
    
    // 如果content是字符串，直接显示HTML内容
    if (typeof content === 'string') {
        announcementContent.innerHTML = content;
    } 
    // 如果content是对象，根据类型显示不同的内容
    else if (typeof content === 'object') {
        // 如果有type字段，根据类型渲染
        if (content.type) {
            switch (content.type) {
                case 'html':
                    // 直接渲染HTML内容
                    announcementContent.innerHTML = content.html || '';
                    break;
                case 'simple':
                    // 简单文本内容
                    announcementContent.innerHTML = `
                        <div class="announcement-text">
                            <div class="welcome-message">${content.text || ''}</div>
                        </div>
                    `;
                    break;
                case 'contact':
                    // 联系方式内容
                    announcementContent.innerHTML = `
                        <div class="announcement-text">
                            <div class="welcome-message mb-3">${content.description || ''}</div>
                            ${content.contact_info ? `
                            <div class="contact-info mt-3">
                                ${content.contact_info}
                            </div>
                            ` : ''}
                        </div>
                    `;
                    break;
                case 'list':
                    // 列表内容
                    let listHtml = `
                        <div class="announcement-text">
                            ${content.title ? `<div class="welcome-message mb-3">${content.title}</div>` : ''}
                            <ul class="announcement-list">
                    `;
                    
                    if (content.items && Array.isArray(content.items)) {
                        content.items.forEach(item => {
                            listHtml += `<li>${item.icon ? `<i class="${item.icon} me-2"></i>` : ''}${item.text}</li>`;
                        });
                    }
                    
                    listHtml += `
                            </ul>
                        </div>
                    `;
                    announcementContent.innerHTML = listHtml;
                    break;
                default:
                    // 默认情况，尝试显示welcome信息
                    announcementContent.innerHTML = `
                        <div class="announcement-text">
                            <div class="welcome-message mb-3">
                                ${content.welcome ? content.welcome.description : (content.description || '')}
                            </div>
                            ${content.contact ? `
                            <div class="contact-info mt-3">
                                <p class="mb-2"><i class="fab fa-qq me-2"></i>QQ群号：${content.contact.qq_group}</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
            }
        } else {
            // 兼容旧格式
            announcementContent.innerHTML = `
                <div class="announcement-text">
                    <div class="welcome-message mb-3">
                        ${content.welcome ? content.welcome.description : (content.description || '')}
                    </div>
                    ${content.contact ? `
                    <div class="contact-info mt-3">
                        <p class="mb-2"><i class="fab fa-qq me-2"></i>QQ群号：${content.contact.qq_group}</p>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }
}

// 渲染底部友情链接
function renderBottomTools(announcement) {
    const bottomAdContent = document.getElementById('bottom-ad-content');
    if (!bottomAdContent) return;

    // 更新标题
    const headerTitle = document.querySelector('#bottom-ad-card .card-header h5');
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fas fa-link me-2"></i>${announcement.title || '友情链接'}`;
    }

    // 构建友情链接内容
    const content = announcement.content;
    
    // 如果content是字符串，直接显示HTML内容
    if (typeof content === 'string') {
        bottomAdContent.innerHTML = content;
    } 
    // 如果content是对象，根据类型显示不同的内容
    else if (typeof content === 'object') {
        // 如果有type字段，根据类型渲染
        if (content.type) {
            switch (content.type) {
                case 'html':
                    // 直接渲染HTML内容
                    bottomAdContent.innerHTML = content.html || '';
                    break;
                case 'links':
                    // 友情链接列表
                    let linksHtml = `<div class="row"><div class="col-12"><div class="d-flex flex-wrap justify-content-around">`;
                    
                    if (content.links && Array.isArray(content.links)) {
                        content.links.forEach(link => {
                            linksHtml += `
                                <a href="${link.url || '#'}" class="btn btn-outline-primary m-2" target="_blank" title="${link.description || ''}">
                                    ${link.icon ? `<i class="${link.icon} me-2"></i>` : ''}${link.name || '链接'}
                                </a>
                            `;
                        });
                    }
                    
                    linksHtml += `</div></div></div>`;
                    bottomAdContent.innerHTML = linksHtml;
                    break;
                case 'categories':
                    // 分类友情链接
                    let categoriesHtml = `<div class="row">`;
                    
                    if (content.categories && Array.isArray(content.categories)) {
                        content.categories.forEach(category => {
                            categoriesHtml += `
                                <div class="col-md-${12 / content.categories.length}">
                                    <h6 class="category-title">${category.name || '分类'}</h6>
                                    <ul class="link-list">
                            `;
                            
                            if (category.links && Array.isArray(category.links)) {
                                category.links.forEach(link => {
                                    categoriesHtml += `
                                        <li>
                                            <a href="${link.url || '#'}" target="_blank" title="${link.description || ''}">
                                                ${link.icon ? `<i class="${link.icon} me-2"></i>` : ''}${link.name || '链接'}
                                            </a>
                                        </li>
                                    `;
                                });
                            }
                            
                            categoriesHtml += `
                                    </ul>
                                </div>
                            `;
                        });
                    }
                    
                    categoriesHtml += `</div>`;
                    bottomAdContent.innerHTML = categoriesHtml;
                    break;
                default:
                    // 默认情况，尝试显示工具列表（兼容旧格式）
                    renderLegacyTools(content);
            }
        } else if (content.tools) {
            // 兼容旧格式
            renderLegacyTools(content);
        } else {
            bottomAdContent.innerHTML = '<div class="alert alert-info">没有可用的友情链接</div>';
        }
    }
}

// 渲染旧格式的工具列表（兼容性函数）
function renderLegacyTools(content) {
    const bottomAdContent = document.getElementById('bottom-ad-content');
    if (!bottomAdContent) return;
    
    const tools = content.tools;
    if (!tools || !Array.isArray(tools)) {
        bottomAdContent.innerHTML = '<div class="alert alert-info">没有可用的友情链接</div>';
        return;
    }
    
    let html = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex flex-wrap justify-content-around">
    `;

    tools.forEach(tool => {
        html += `
            <a href="${tool.url}" class="btn btn-outline-primary m-2" target="_blank">
                <i class="${tool.icon} me-2"></i>${tool.name}
            </a>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;

    bottomAdContent.innerHTML = html;
}

// 绑定事件
function bindEvents() {
    // 刷新验证码按钮
    document.getElementById('refresh-captcha').addEventListener('click', refreshCaptcha);

    // 验证码图片点击刷新
    document.getElementById('captcha-image').addEventListener('click', refreshCaptcha);

    // 自动识别验证码按钮
    document.getElementById('auto-ocr').addEventListener('click', autoRecognizeCaptcha);

    // 登录表单提交
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        handleLogin();
    });

    // 退出登录按钮
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // 查询表单提交
    document.getElementById('query-form').addEventListener('submit', function (e) {
        e.preventDefault();
        handleQuery();
    });

    // 空闲教室查询表单提交
    document.getElementById('free-classroom-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const buildingPrefix = document.getElementById('free-building').value;
        const week = document.getElementById('free-week').value;
        const day = document.getElementById('free-day').value;
        const startPeriod = document.getElementById('start-period').value;
        const endPeriod = document.getElementById('end-period').value;
        const xnxqh = document.getElementById('xnxqh').value;

        // 显示加载状态
        const submitBtn = document.getElementById('free-classroom-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>查询中...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/free_classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    building_prefix: buildingPrefix,
                    week: week,
                    day: day,
                    start_period: startPeriod,
                    end_period: endPeriod,
                    xnxqh: xnxqh
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // 显示结果区域
                const resultsDiv = document.getElementById('free-classroom-results');
                resultsDiv.style.display = 'block';

                // 更新消息
                const messageDiv = document.getElementById('free-classroom-message');
                messageDiv.textContent = result.data.message;

                // 清空并填充教室列表
                const listBody = document.getElementById('free-classroom-list');
                listBody.innerHTML = '';

                result.data.free_classrooms.forEach((room, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${room}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-schedule-btn" data-room="${room}">
                                <i class="fas fa-calendar-alt me-1"></i>查看课表
                            </button>
                        </td>
                    `;
                    listBody.appendChild(row);
                });

                // 添加查看课表按钮的事件监听器
                document.querySelectorAll('.view-schedule-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const room = this.getAttribute('data-room');
                        document.getElementById('room_name').value = room;
                        document.getElementById('query-form').dispatchEvent(new Event('submit'));
                    });
                });
            } else {
                showToast('error', result.message || '查询失败，请重试');
            }
        } catch (error) {
            console.error('查询空闲教室出错:', error);
            showToast('error', '查询出错，请重试');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // 学期选择变化时，重新获取当前周次和星期
    const xnxqhSelect = document.getElementById('xnxqh');
    if (xnxqhSelect) {
        xnxqhSelect.addEventListener('change', function () {
            fetchCurrentWeekDay(this.value);
        });
    }
}

// 添加教学楼输入建议功能
async function initBuildingSuggestions() {
    try {
        const response = await fetch('/api/classrooms');
        const result = await response.json();
        
        if (result.status === 'success') {
            const buildings = new Set();
            result.data.classrooms.forEach(room => {
                // 提取教学楼前缀（例如从 "JA101" 提取 "JA"）
                const match = room.match(/^[A-Za-z]+/);
                if (match) {
                    buildings.add(match[0]);
                }
            });

            // 更新建筑物列表
            const buildingList = document.getElementById('building-list');
            buildingList.innerHTML = '';
            buildings.forEach(building => {
                const option = document.createElement('option');
                option.value = building;
                buildingList.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载教学楼列表出错:', error);
    }
}

// 页面加载完成后初始化教学楼建议
document.addEventListener('DOMContentLoaded', function() {
    initBuildingSuggestions();
});

// 刷新验证码
function refreshCaptcha() {
    const captchaImage = document.getElementById('captcha-image');
    const timestamp = new Date().getTime(); // 添加时间戳防止缓存

    // 显示加载状态
    captchaImage.src = '';
    captchaImage.alt = '加载中...';

    // 请求新验证码
    fetch(`/get_captcha?t=${timestamp}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                captchaImage.src = data.captcha_image;
                captchaImage.alt = '验证码';

                // 清空验证码输入框
                document.getElementById('captcha').value = '';
            } else {
                showMessage('login-message', '获取验证码失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showMessage('login-message', '获取验证码出错: ' + error, 'danger');
        });
}

// 自动识别验证码
function autoRecognizeCaptcha() {
    const captchaInput = document.getElementById('captcha');
    const timestamp = new Date().getTime();

    // 显示加载状态
    captchaInput.value = '识别中...';
    captchaInput.disabled = true;

    // 请求自动识别
    fetch(`/get_captcha?t=${timestamp}&auto_ocr=true`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.ocr_result) {
                // 更新验证码图片和输入框
                document.getElementById('captcha-image').src = data.captcha_image;
                captchaInput.value = data.ocr_result;
            } else {
                showMessage('login-message', '自动识别失败: ' + (data.message || '无法识别'), 'warning');
                captchaInput.value = '';
            }
            captchaInput.disabled = false;
        })
        .catch(error => {
            showMessage('login-message', '自动识别出错: ' + error, 'danger');
            captchaInput.value = '';
            captchaInput.disabled = false;
        });
}

// 处理登录
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captcha = document.getElementById('captcha').value;

    if (!username || !password || !captcha) {
        showMessage('login-message', '请填写完整的登录信息', 'warning');
        return;
    }

    // 显示加载状态
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    const originalBtnText = loginBtn.textContent;
    loginBtn.textContent = '登录中...';
    loginBtn.disabled = true;

    // 发送登录请求
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
            captcha: captcha
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showMessage('login-message', '登录成功！', 'success');

                // 更新UI状态
                document.getElementById('login-section').classList.add('d-none');
                document.getElementById('user-info-section').classList.remove('d-none');
                document.getElementById('query-btn').disabled = false;

                // 清空登录表单
                document.getElementById('login-form').reset();
            } else {
                showMessage('login-message', '登录失败: ' + data.message, 'danger');
                refreshCaptcha(); // 刷新验证码
            }
        })
        .catch(error => {
            showMessage('login-message', '登录请求出错: ' + error, 'danger');
            refreshCaptcha(); // 刷新验证码
        })
        .finally(() => {
            // 恢复按钮状态
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        });
}

// 处理登出
function handleLogout() {
    // 显示加载状态
    const logoutBtn = document.getElementById('logout-btn');
    const originalBtnText = logoutBtn.textContent;
    logoutBtn.textContent = '退出中...';
    logoutBtn.disabled = true;

    // 发送登出请求
    fetch('/logout', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 更新UI状态
                document.getElementById('login-section').classList.remove('d-none');
                document.getElementById('user-info-section').classList.add('d-none');
                document.getElementById('query-btn').disabled = true;
                document.getElementById('result-section').classList.add('d-none');
                
                // 隐藏空闲教室结果
                const freeClassroomResults = document.getElementById('free-classroom-results');
                if (freeClassroomResults) {
                    freeClassroomResults.style.display = 'none';
                }

                // 刷新验证码
                refreshCaptcha();
            } else {
                showMessage('login-message', '登出失败: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showMessage('login-message', '登出请求出错: ' + error, 'danger');
        })
        .finally(() => {
            // 恢复按钮状态
            logoutBtn.textContent = originalBtnText;
            logoutBtn.disabled = false;
        });
}

// 处理查询
async function handleQuery() {
    const xnxqh = document.getElementById('xnxqh').value;
    const room_name = document.getElementById('room_name').value;
    const week = document.getElementById('week').value;
    const day = document.getElementById('day').value;
    const jc1 = document.getElementById('jc1').value;
    const jc2 = document.getElementById('jc2').value;

    if (!xnxqh || !room_name || !week) {
        showMessage('result-container', '请填写完整的查询信息', 'warning');
        return;
    }

    // 检查节次选择是否合理
    if (parseInt(jc1) > parseInt(jc2)) {
        showMessage('result-container', '开始节次不能大于结束节次', 'warning');
        return;
    }

    // 显示加载状态
    const queryBtn = document.getElementById('query-btn');
    const originalBtnText = queryBtn.textContent;
    queryBtn.textContent = '查询中...';
    queryBtn.disabled = true;

    // 显示结果区域
    const resultSection = document.getElementById('result-section');
    resultSection.classList.remove('d-none');

    // 隐藏空闲教室结果区域
    const freeClassroomResults = document.getElementById('free-classroom-results');
    if (freeClassroomResults) {
        freeClassroomResults.style.display = 'none';
    }

    // 清空结果容器并显示加载提示
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">正在查询课表数据...</p>
        </div>
    `;

    try {
        const response = await fetch('/query_classtable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                xnxqh,
                room_name,
                week,
                day,
                jc1,
                jc2
            })
        });

        if (response.status === 401) {
            // 未登录，显示错误并滚动到登录区域
            showMessage('result-container', '您尚未登录或登录已过期，请先登录', 'danger');
            document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
            throw new Error('未登录');
        }

        const result = await response.json();

        if (result.status === 'success') {
            console.log(result.data);
            // 传递节次范围信息，但不强制过滤
            renderClassTable(result.data, room_name, week, day, jc1, jc2);
        } else {
            showMessage('result-container', '查询失败: ' + result.message, 'danger');
        }
    } catch (error) {
        if (error.message !== '未登录') {
            showMessage('result-container', '查询请求出错: ' + error, 'danger');
        }
    } finally {
        // 恢复按钮状态
        queryBtn.textContent = originalBtnText;
        queryBtn.disabled = false;
    }
}

// 渲染课表
function renderClassTable(data, roomName, week, day, jc1, jc2) {
    const resultContainer = document.getElementById('result-container');
    const roomsData = data;

    // 如果没有数据
    if (!roomsData || roomsData.length === 0) {
        resultContainer.innerHTML = `<div class="alert alert-info">未找到匹配 "${roomName}" 的教室课表数据</div>`;
        return;
    }

    // 显示结果区域
    document.getElementById('result-section').classList.remove('d-none');

    // 获取星期几的名称
    const dayName = day ? getDayName(day) : '';

    // 构建查询信息显示
    let queryInfo = `查询成功！找到 ${roomsData.length} 个匹配的教室`;
    if (jc1 && jc2) {
        queryInfo += `，节次范围：第${jc1}节至第${jc2}节`;
    }

    let html = `<div class="alert alert-success">${queryInfo}</div>`;

    // 遍历每个匹配的教室
    roomsData.forEach(room => {
        // 添加教室标题
        if (day) {
            const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            html += `<h4 class="room-title"><i class="fas fa-door-open me-2"></i>${room.name} - ${dayNames[parseInt(day)]}</h4>`;
        } else {
            html += `<h4 class="room-title"><i class="fas fa-door-open me-2"></i>${room.name}</h4>`;
        }

        // 如果指定了星期几，只显示该天的课表
        if (day) {
            html += createDayTable(room, day, jc1, jc2);
        } else {
            // 否则显示整周课表
            html += createWeekTable(room, jc1, jc2);
        }
    });

    resultContainer.innerHTML = html;
}

// 创建单日课表
function createDayTable(room, day, jc1, jc2) {
    const daySchedule = room.schedule[day];
    if (!daySchedule) {
        return `<div class="alert alert-info">该教室在选定的日期没有课程安排</div>`;
    }

    let html = `<table class="timetable">
        <thead>
            <tr>
                <th width="120">节次</th>
                <th>课程信息</th>
            </tr>
        </thead>
        <tbody>`;

    // 获取所有节次，并按照数字顺序排序
    const allPeriods = Object.keys(daySchedule).sort((a, b) => {
        // 如果是数字格式的节次（如"0102"），按数字排序
        if (!isNaN(a) && !isNaN(b)) {
            return parseInt(a) - parseInt(b);
        }
        // 如果是"第X节"格式，提取数字部分排序
        const numA = a.match(/第(\d+)节/);
        const numB = b.match(/第(\d+)节/);
        if (numA && numB) {
            return parseInt(numA[1]) - parseInt(numB[1]);
        }
        // 其他情况按字符串排序
        return a.localeCompare(b);
    });

    // 过滤掉重复的节次（例如，如果有"第1节"和"0102"，只显示"0102"）
    const displayedPeriods = [];
    const displayedClasses = new Set(); // 用于跟踪已显示的课程

    // 首先添加数字格式的节次（如"0102"）
    allPeriods.forEach(period => {
        if (!isNaN(period) && period.length === 4) {
            displayedPeriods.push(period);
        }
    });

    // 然后添加"第X节"格式的节次
    allPeriods.forEach(period => {
        if (period.match(/第\d+节/)) {
            const num = period.match(/第(\d+)节/)[1];
            // 检查是否已经有对应的数字格式节次
            const hasNumericPeriod = displayedPeriods.some(p => {
                if (p.length === 4) {
                    const start = parseInt(p.substring(0, 2));
                    const end = parseInt(p.substring(2, 4));
                    return parseInt(num) >= start && parseInt(num) <= end;
                }
                return false;
            });
            if (!hasNumericPeriod) {
                displayedPeriods.push(period);
            }
        }
    });

    // 按顺序显示课程信息
    for (const period of displayedPeriods) {
        const classes = daySchedule[period];
        const periodNum = !isNaN(period) ? parseInt(period.substring(0, 2)) : parseInt(period.match(/第(\d+)节/)[1]);
        
        // 检查是否在选定的节次范围内
        const isInSelectedRange = (!jc1 || periodNum >= parseInt(jc1)) && (!jc2 || periodNum <= parseInt(jc2));
        
        if (classes && classes.length > 0) {
            // 过滤掉已经显示过的课程
            const newClasses = classes.filter(classInfo => {
                const key = classInfo.original_text || classInfo.course_name;
                if (displayedClasses.has(key)) {
                    return false;
                }
                displayedClasses.add(key);
                return true;
            });

            if (newClasses.length === 0) continue;

            const classInfo = newClasses[0];
            
            // 格式化节次显示
            let displayPeriod = period;
            if (!isNaN(period) && period.length === 4) {
                const start = parseInt(period.substring(0, 2));
                const end = parseInt(period.substring(2, 4));
                displayPeriod = `第${start}-${end}节`;
            }
            
            // 添加高亮类，如果在用户选择的节次范围内
            const highlightClass = isInSelectedRange ? ' highlighted-period' : '';
            
            html += `<tr class="has-class${highlightClass}">
                <td class="period-cell">
                    <div class="period-info">${displayPeriod}</div>
                </td>
                <td class="course-cell">`;
            
            // 如果有原始文本，直接显示
            if (classInfo.original_text) {
                const lines = classInfo.original_text.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    html += `<div>${line}</div>`;
                });
            } 
            // 否则显示解析后的信息
            else if (classInfo.all_lines && classInfo.all_lines.length > 0) {
                classInfo.all_lines.forEach(line => {
                    html += `<div>${line}</div>`;
                });
            }
            // 兼容旧格式
            else {
                html += `<div><strong>${classInfo.course_name || '未知课程'}</strong></div>`;
                if (classInfo.room) {
                    html += `<div>教室: ${classInfo.room}</div>`;
                }
                if (classInfo.class_info && classInfo.class_info.length > 0) {
                    classInfo.class_info.forEach(info => {
                        html += `<div>${info}</div>`;
                    });
                }
            }
            
            html += `</td>
            </tr>`;
        } else {
            // 格式化节次显示
            let displayPeriod = period;
            if (!isNaN(period) && period.length === 4) {
                const start = parseInt(period.substring(0, 2));
                const end = parseInt(period.substring(2, 4));
                displayPeriod = `第${start}-${end}节`;
            }
            
            // 添加高亮类，如果在用户选择的节次范围内
            const highlightClass = isInSelectedRange ? ' highlighted-period' : '';
            
            html += `<tr class="no-class${highlightClass}">
                <td class="period-cell">
                    <div class="period-info">${displayPeriod}</div>
                </td>
                <td class="course-cell">
                    <div>空闲</div>
                </td>
            </tr>`;
        }
    }

    html += `</tbody></table>`;
    return html;
}

// 创建整周课表
function createWeekTable(room, jc1, jc2) {
    const periodNames = ['第一节', '第二节', '第三节', '第四节', '第五节', '第六节', '第七节', '第八节', '第九节', '第十节', '第十一节', '第十二节', '第十三节'];

    let html = `<table class="timetable">
        <tbody>`;

    // 遍历每个时间段
    for (let period = 0; period < periodNames.length; period++) {
        const periodName = periodNames[period];
        const periodNum = period + 1;
        const periodKey = `第${periodNum}节`;
        
        // 检查是否在用户选择的节次范围内
        const isInSelectedRange = jc1 && jc2 && 
            periodNum >= parseInt(jc1) && periodNum <= parseInt(jc2);
        
        // 添加高亮类，如果在用户选择的节次范围内
        const rowHighlightClass = isInSelectedRange ? ' highlighted-period' : '';
        
        html += `<tr class="${rowHighlightClass}">`;

        // 遍历每天
        for (let day = 1; day <= 7; day++) {
            const daySchedule = room.schedule[day.toString()];
            
            if (daySchedule && daySchedule[periodKey] && daySchedule[periodKey].length > 0) {
                // 找到包含当前节次的课程
                const classInfo = daySchedule[periodKey][0];
                
                // 检查是否已经在前面的节次中显示过这个课程
                let alreadyDisplayed = false;
                if (classInfo.period && classInfo.period.length === 4) {
                    const startPeriod = parseInt(classInfo.period.substring(0, 2));
                    if (startPeriod < periodNum) {
                        alreadyDisplayed = true;
                    }
                }
                
                if (!alreadyDisplayed) {
                    // 添加高亮类，如果在用户选择的节次范围内
                    const cellClass = isInSelectedRange ? 'has-class highlighted-period' : 'has-class';
                    
                    html += `<td class="${cellClass}">`;
                    
                    // 如果有原始文本，显示第一行（课程名称）
                    if (classInfo.original_text) {
                        const lines = classInfo.original_text.split('\n').filter(line => line.trim());
                        if (lines.length > 0) {
                            html += `<div><strong>${lines[0]}</strong></div>`;
                        }
                        // 如果有更多行，添加一个提示
                        if (lines.length > 1) {
                            html += `<div class="small text-muted">查看详情</div>`;
                        }
                    } 
                    // 否则显示解析后的课程名称
                    else {
                        html += `<div><strong>${classInfo.course_name || '未知课程'}</strong></div>`;
                    }
                    
                    html += `</td>`;
                } else {
                    // 如果已经显示过，显示一个占位符
                    // 添加高亮类，如果在用户选择的节次范围内
                    const cellClass = isInSelectedRange ? 'has-class continued highlighted-period' : 'has-class continued';
                    
                    html += `<td class="${cellClass}"></td>`;
                }
            } else {
                // 添加高亮类，如果在用户选择的节次范围内
                const cellClass = isInSelectedRange ? 'no-class highlighted-period' : 'no-class';
                
                html += `<td class="${cellClass}">空闲</td>`;
            }
        }

        html += `</tr>`;
    }

    html += `</tbody></table>`;
    return html;
}

// 检查登录状态
function checkLoginStatus() {
    // 这里可以添加检查登录状态的逻辑
    // 如果已登录，显示用户信息区域，隐藏登录区域
    // 如果未登录，显示登录区域，隐藏用户信息区域
}

// 显示消息
function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
} 
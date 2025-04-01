$(document).ready(() => {
    const $groupSelect = $('#groupSelect');
    const $teacherSelect = $('#teacherSelect'); 
    const $weekPicker = $('#weekPicker');
    const $scheduleBody = $('#scheduleBody');
    const $scheduleTable = $('#scheduleTable');
    const $groupInfo = $('#groupInfo');
    const $currentWeekDisplay = $('#currentWeekDisplay');
    const $header = $('h1');

    const DEFAULT_WEEK = 1;

    function populateGroupSelect() {
        $.getJSON('/api/groups', (groups) => {
            $groupSelect.empty().append($('<option>', {
                value: '',
                text: 'Выберите группу'
            }));
            $.each(groups, (index, group) => {
                $groupSelect.append($('<option>', {
                    value: group.id,
                    text: group.name
                }));
            });
        });
    }

    function populateTeacherSelect() {
        $.getJSON('/api/teachers', (teachers) => {
            $teacherSelect.empty().append($('<option>', {
                value: '',
                text: 'Выберите преподавателя'
            }));
            $.each(teachers, (index, teacher) => {
                $teacherSelect.append($('<option>', {
                    value: teacher.id,
                    text: teacher.name
                }));
            });
        });
    }

    function populateWeekPicker() {
        for (let i = 1; i <= 52; i++) {
            $weekPicker.append($('<option>', {
                value: i,
                text: `Неделя ${i}`
            }));
        }
    }

    function renderSchedule(scheduleData, dates, groupInfo) {
        $scheduleBody.empty();
        $scheduleTable.find('thead').empty();

        const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const timeIntervals = Object.keys(scheduleData);

        const $thead = $('<thead>').append(
            $('<tr>').append(
                $('<th>').text('Время'),
                ...daysOfWeek.map((day, index) => $('<th>').text(`${day} (${dates[index] || ''})`))
            )
        );
        $scheduleTable.prepend($thead);

        $.each(timeIntervals, (index, time) => {
            const $row = $('<tr>').append($('<td>').text(time));

            $.each(daysOfWeek, (dayIndex, day) => {
                const lessons = scheduleData[time][day];
                const $cell = $('<td>');
                if (lessons && lessons.length > 0) {
                    $.each(lessons, (lessonIndex, lesson) => {
                        const $lessonDiv = $('<div>').addClass(lesson.colorClass).html(
                            `<b>${lesson.subject}</b><br>${lesson.location}<br>` +
                            (lesson.teacherId
                                ? `<a href="teacher.html?staffId=${lesson.teacherId}&week=${$weekPicker.val()}" target="_blank">${lesson.teacher}</a>`
                                : lesson.teacher) +
                            `<br>Группы: ${lesson.groups.map(group => `<a href="index.html?groupId=${group.id}&week=${$weekPicker.val()}" target="_blank">${group.name}</a>`).join(', ')}`
                        );
                        $cell.append($lessonDiv);
                        if (lessonIndex < lessons.length - 1) {
                            $cell.append('<hr>'); 
                        }
                    });
                } else {
                    $cell.text('-'); 
                }
                $row.append($cell);
            });
            $scheduleBody.append($row);
        });

        if (groupInfo) {
            $groupInfo.empty().append(
                $('<h2>').text(groupInfo.title),
                $('<div>').html(groupInfo.description),
                $('<div>').text(groupInfo.semesterInfo)
            );
        } else {
            $groupInfo.empty();
        }

    }

    function loadSchedule(id, week, type) {
        let params = { week: week };
        let apiUrl = '/api/schedule';

        if (type === 'group') {
            params.groupId = id;
        } else if (type === 'teacher') {
            params.staffId = id;
        }

        $.ajax({
            url: apiUrl,
            data: params,
            dataType: 'json',
            success: (data) => {
                let headerText = '';
                if (type === 'group') {
                    headerText = `Расписание группы ${data.groupName}`;
                    renderSchedule(data.schedule, data.dates, data.groupInfo);
                } else if (type === 'teacher') {
                    headerText = `Расписание преподавателя ${data.teacherName}`;
                    renderSchedule(data.schedule, data.dates, null);
                }
                $header.text(headerText);
                updateCurrentWeekDisplay(week);
            },
            error: (error) => {
                console.error('Error loading schedule:', error);
                alert('Failed to load schedule. Please try again.');
            }
        });
    }

    function updateURLParams(id, week, type) {
        const url = new URL(window.location.href);
        url.searchParams.set('week', week);

        if (type === 'group') {
            url.searchParams.set('groupId', id);
            url.searchParams.delete('staffId');
        } else if (type === 'teacher') {
            url.searchParams.set('staffId', id);
            url.searchParams.delete('groupId');
        }

        history.pushState({}, '', url);
    }

    function updateCurrentWeekDisplay(week) {
        $currentWeekDisplay.text(`Неделя ${week}`);
    }

    populateGroupSelect();
    populateTeacherSelect();
    populateWeekPicker();

    const urlParams = new URLSearchParams(window.location.search);
    let initialGroupId = urlParams.get('groupId');
    let initialStaffId = urlParams.get('staffId');
    let initialWeek = urlParams.get('week') || DEFAULT_WEEK;

    $weekPicker.val(initialWeek);
    updateCurrentWeekDisplay(initialWeek);

    if (initialGroupId) {
        $groupSelect.val(initialGroupId);
        loadSchedule(initialGroupId, initialWeek, 'group');
    } else if (initialStaffId) {
        $teacherSelect.val(initialStaffId);
        loadSchedule(initialStaffId, initialWeek, 'teacher');
    }

    $groupSelect.on('change', () => {
        const selectedGroupId = $groupSelect.val();
        const selectedWeek = $weekPicker.val() || DEFAULT_WEEK;
        $teacherSelect.val('');

        if (selectedGroupId) {
            loadSchedule(selectedGroupId, selectedWeek, 'group');
            updateURLParams(selectedGroupId, selectedWeek, 'group');
        } else {
            clearSchedule();
            updateURLParams('', selectedWeek, 'group');
        }
    });

    $teacherSelect.on('change', () => {
        const selectedStaffId = $teacherSelect.val();
        const selectedWeek = $weekPicker.val() || DEFAULT_WEEK;
        $groupSelect.val('');

        if (selectedStaffId) {
            loadSchedule(selectedStaffId, selectedWeek, 'teacher');
            updateURLParams(selectedStaffId, selectedWeek, 'teacher');
        } else {
            clearSchedule();
            updateURLParams('', selectedWeek, 'teacher');
        }
    });

    $weekPicker.on('change', () => {
        const selectedWeek = $weekPicker.val();
        const selectedGroupId = $groupSelect.val();
        const selectedStaffId = $teacherSelect.val();

        if (selectedGroupId) {
            loadSchedule(selectedGroupId, selectedWeek, 'group');
            updateURLParams(selectedGroupId, selectedWeek, 'group');
        } else if (selectedStaffId) {
            loadSchedule(selectedStaffId, selectedWeek, 'teacher');
            updateURLParams(selectedStaffId, selectedWeek, 'teacher');
        }
    });

    function clearSchedule() {
        $scheduleBody.empty();
        $scheduleTable.find('thead').empty();
        $header.text('Расписание занятий');
        $groupInfo.empty();
    }

});

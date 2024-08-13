/**
 * Perform UI validation when modifying the Turbonomic Action Settings.
 */
function onSubmit() {
    var validUser = true;
    var validGroup = true;
    var populateAssignee = g_form.getValue('populate_assignee');

    if (populateAssignee == 'true') {
        var userName = g_form.getValue('assigned_user');
        var groupName = g_form.getValue('assigned_group');

        if (userName == null || userName.length == 0) {
            g_form.hideErrorBox('assigned_user');
            g_form.showErrorBox('assigned_user', 'Please select a valid user');
            validUser = false;
        }
        else {
            g_form.hideErrorBox('assigned_user');
            validUser = true;
        }

        if (groupName == null || groupName.length == 0) {
            g_form.hideErrorBox('assigned_group');
            g_form.showErrorBox('assigned_group', 'Please select a valid group');
            validGroup = false;
        }
        else {
            g_form.hideErrorBox('assigned_group');
            validGroup = true;
        }
    }

    return (validUser && validGroup);
}
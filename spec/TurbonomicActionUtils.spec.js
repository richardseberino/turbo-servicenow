describe('Test Turbonomic Action Utils operations', function () {
	let turbonomicActionUtils = new TurbonomicActionUtils();

	it('Test getting the from and to values from input string', function () {
        let emptyResult = {
            from : "",
            to   : ""
        }

        let nonEmptyResult = {
                from : "1GB",
                to   : "2GB"
        }

        let actionDescription = "Test description";
		let result = turbonomicActionUtils.getFromAndToValuesFromInput(actionDescription);
		
		expect(result.from).toEqual(emptyResult.from);
		expect(result.to).toEqual(emptyResult.to);

        actionDescription = "Test description with from string only";
		result = turbonomicActionUtils.getFromAndToValuesFromInput(actionDescription);
		
		expect(result.from).toEqual(emptyResult.from);
		expect(result.to).toEqual(emptyResult.to);

        actionDescription = "Test description with to string only";
		result = turbonomicActionUtils.getFromAndToValuesFromInput(actionDescription);
		
		expect(result.from).toEqual(emptyResult.from);
		expect(result.to).toEqual(emptyResult.to);

        actionDescription = "Test increase memory from 1GB to 2GB";
		result = turbonomicActionUtils.getFromAndToValuesFromInput(actionDescription);
		
		expect(result.from).toEqual(nonEmptyResult.from);
		expect(result.to).toEqual(nonEmptyResult.to);
	});

});
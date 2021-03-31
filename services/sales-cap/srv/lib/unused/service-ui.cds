using SalesService from './sales-service';

annotate SalesService.Visits with {
    ID @(
            UI.Hidden,
            Common: {
            Text: description
            }
        );
	type       @title: 'Type';
	unique     @title: 'Unique';
}

annotate SalesService.Drafts with {
	type    @title: 'Type';
	default @title: 'Default';
}

annotate SalesService.Appendixes with {
	type    @title: 'Type';
	default @title: 'Default';
}

annotate SalesService.Visits with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Visit',
			TypeNamePlural: 'Visits'
		},
		SelectionFields: [type],
		LineItem: [
			{Value: type}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		FieldGroup#Main: {
			Data: [
				{Value: type}
			]
		}		
	},
) {

}; 

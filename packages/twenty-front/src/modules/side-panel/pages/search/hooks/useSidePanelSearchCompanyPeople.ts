import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useSearchableObjectNameSingulars } from '@/side-panel/hooks/useSearchableObjectNameSingulars';
import { type SearchResultItem } from '@/side-panel/pages/search/hooks/useSidePanelSearchRecords';
import { sidePanelSearchObjectFilterState } from '@/side-panel/states/sidePanelSearchObjectFilterState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const MAX_COMPANY_PEOPLE_RESULTS = 10;

// The searchVector is per row and never traverses a relation, so searching a
// company name can only ever return the company itself. Pulling its people in
// a second query is what makes "who do I know at Acme" answerable from the
// search box without denormalizing the company name onto every person.
export const useSidePanelSearchCompanyPeople = ({
  searchResultItems,
}: {
  searchResultItems: SearchResultItem[];
}) => {
  const sidePanelSearchObjectFilter = useAtomStateValue(
    sidePanelSearchObjectFilterState,
  );
  const searchableObjectNameSingulars = useSearchableObjectNameSingulars({
    selectedObjectNameSingular: sidePanelSearchObjectFilter,
  });

  const { objectMetadataItem: personObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.Person,
    });

  const matchedCompanies = useMemo(
    () =>
      searchResultItems.filter(
        (item) => item.objectNameSingular === CoreObjectNameSingular.Company,
      ),
    [searchResultItems],
  );

  const companyIds = useMemo(
    () => matchedCompanies.map((company) => company.recordId),
    [matchedCompanies],
  );

  const alreadyListedPersonIds = useMemo(
    () =>
      new Set(
        searchResultItems
          .filter(
            (item) => item.objectNameSingular === CoreObjectNameSingular.Person,
          )
          .map((item) => item.recordId),
      ),
    [searchResultItems],
  );

  // Honours the object filter chip: narrowing the search to Companies means the
  // person rows were deliberately excluded.
  const isPersonSearchable = searchableObjectNameSingulars.includes(
    CoreObjectNameSingular.Person,
  );

  const { records, loading } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: { companyId: { in: companyIds } },
    limit: MAX_COMPANY_PEOPLE_RESULTS,
    skip: companyIds.length === 0 || !isPersonSearchable,
  });

  const companyPeopleItems: SearchResultItem[] = useMemo(
    () =>
      records
        .filter((record) => !alreadyListedPersonIds.has(record.id))
        .map((record) => {
          const firstName = record.name?.firstName ?? '';
          const lastName = record.name?.lastName ?? '';

          return {
            id: `company-person-${record.id}`,
            label: `${firstName} ${lastName}`.trim(),
            objectNameSingular: CoreObjectNameSingular.Person,
            recordId: record.id,
            imageUrl: record.avatarUrl,
            objectLabel: personObjectMetadataItem.labelSingular,
            avatarType: 'rounded' as const,
          };
        })
        .filter((item) => item.label.length > 0),
    [records, alreadyListedPersonIds, personObjectMetadataItem],
  );

  const singleMatchedCompanyLabel = isDefined(matchedCompanies[0])
    ? matchedCompanies[0].label
    : null;

  return {
    companyPeopleItems,
    loading,
    singleMatchedCompanyLabel:
      matchedCompanies.length === 1 ? singleMatchedCompanyLabel : null,
  };
};

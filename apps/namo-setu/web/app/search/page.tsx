import { NamoShell } from "../../components/namo-shell";
import { PageFrame, SectionHeader } from "../../components/namo-ui";
import { SearchTempleResults } from "../../components/search-temple-results";

export default function TempleSearchPage() {
  return (
    <NamoShell>
      <PageFrame>
        <SectionHeader label="Temple Search" title="Find Temples, Darshan Slots, and Nearby Routes" />
        <SearchTempleResults />
      </PageFrame>
    </NamoShell>
  );
}

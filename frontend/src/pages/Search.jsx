import PageWrapper from "../layout/PageWrapper";
import GlobalSearch from "../search/GlobalSearch";

// Search page with global address lookup
function Search() {
  return (
    <PageWrapper>
      <div className="min-h-[60vh] flex items-center justify-center">
        <GlobalSearch />
      </div>
    </PageWrapper>
  );
}

export default Search;

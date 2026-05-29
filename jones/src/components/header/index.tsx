import dynamic from "next/dynamic";
import { DialogType, useDialog, useAnnouncementState } from "@Contexts/UIContext";

import HeaderSection from "./HeaderSection";

const SearchBox = dynamic(() => import("./SearchBox"), { ssr: false, loading: () => null });
const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false, loading: () => null });
const Announcement = dynamic(() => import("./Announcement"), { ssr: false, loading: () => null });

export default function Header() {
  const { currentDialog } = useDialog();
  const [announcementVisible] = useAnnouncementState();

  return (
    <>
      {currentDialog === DialogType.SEARCH_BOX ? <SearchBox /> : null}
      {currentDialog === DialogType.SIDEBAR_DIALOG ? <Sidebar /> : null}
      {announcementVisible ? <Announcement /> : null}
      <HeaderSection />
    </>
  );
}

import * as S from "../general/style";
import CustomWrapper from "../../../component/common/wrapper";
import MainLayoutSetting from "../../../component/unit/setting/main";
import FreeBoardSetting from "../../../component/unit/setting/freeBoard";
import SlideSetting from "../../../component/unit/setting/slide";
import { useTab } from "../../../etc/hooks/useTab";
import { motion, AnimatePresence } from "framer-motion";
import MainNoticeSetting from "../../../component/unit/setting/notice";
import MainProfileSetting from "../../../component/unit/setting/profile";
import MainDdaySetting from "../../../component/unit/setting/dday";

export default function SettingPage() {
  const {
    tabRefs,
    handleTabChange,
    indicatorStyle,
    activeTab,
    contentVariants
  } = useTab();

  const tabs = [
    { key: "1", label: "메인 레이아웃 설정", component: <MainLayoutSetting /> },
    { key: "2", label: "스티커보드 설정", component: <FreeBoardSetting /> },
    {
      key: "3",
      label: "메인 공지 설정",
      component: <MainNoticeSetting />
    },
    { key: "4", label: "배너 설정", component: <></> },
    { key: "5", label: "프로필 설정", component: <MainProfileSetting /> },
    { key: "6", label: "슬라이드 배너 설정", component: <SlideSetting /> },
    { key: "7", label: "디데이 설정", component: <MainDdaySetting /> },
    { key: "8", label: "대문 페이지 설정", component: <></> }
  ];

  return (
    <S.Wrapper>
      <S.TabWrap>
        <S.TabBox>
          {tabs.map((tab, index) => (
            <S.TabItem
              ref={el => (tabRefs.current[index] = el)}
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              active={tab.key === activeTab}
            >
              {tab.label}
            </S.TabItem>
          ))}
        </S.TabBox>
        <S.TabIndicatorBox>
          <S.TabIndicator
            as={motion.div}
            style={{ width: indicatorStyle.width, left: indicatorStyle.left }}
            initial={{ left: 0, width: 0 }}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </S.TabIndicatorBox>
      </S.TabWrap>
      <CustomWrapper width="768px">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {tabs.find(tab => tab.key === activeTab)?.component}
          </motion.div>
        </AnimatePresence>
      </CustomWrapper>
    </S.Wrapper>
  );
}

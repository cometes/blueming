import * as S from "./style";
import CustomWrapper from "../../../component/common/wrapper";
import GeneralSetting from "../../../component/unit/setting/general";
import DesignSetting from "../../../component/unit/setting/design";
import MenuSetting from "../../../component/unit/setting/menu";
import ThemeSetting from "../../../component/unit/setting/theme";
import { motion, AnimatePresence } from "framer-motion";
import { useTab } from "../../../etc/hooks/useTab";
import EffectSetting from "../../../component/unit/setting/effect";

export default function SettingPage() {
  const {
    tabRefs,
    handleTabChange,
    indicatorStyle,
    activeTab,
    contentVariants
  } = useTab();

  const tabs = [
    { key: "1", label: "홈페이지 설정", component: <GeneralSetting /> },
    { key: "2", label: "전체 디자인 설정", component: <DesignSetting /> },
    { key: "3", label: "메뉴 디자인 설정", component: <MenuSetting /> },
    { key: "4", label: "기타 설정", component: <EffectSetting /> },
    { key: "5", label: "테마 설정", component: <ThemeSetting /> }
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
            layout
          >
            {tabs.find(tab => tab.key === activeTab)?.component}
          </motion.div>
        </AnimatePresence>
      </CustomWrapper>
    </S.Wrapper>
  );
}

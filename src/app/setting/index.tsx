import { useState } from "react";
import GeneralSetting from "../../component/unit/setting/general";
import MainLayoutSetting from "../../component/unit/setting/main";
import DesignSetting from "../../component/unit/setting/design";
import MenuSetting from "../../component/unit/setting/menu";
import ThemeSetting from "../../component/unit/setting/theme";
import EffectSetting from "../../component/unit/setting/effect";
import FreeBoardSetting from "../../component/unit/setting/freeBoard";
import SlideSetting from "../../component/unit/setting/slide";
import MainNoticeSetting from "../../component/unit/setting/notice";
import MainProfileSetting from "../../component/unit/setting/profile";
import MainDdaySetting from "../../component/unit/setting/dday";
import * as S from "./style";
import AdminRoute from "../../component/common/guards/AdminRoute";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isAsideExpanded, setIsAsideExpanded] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const toggleAside = () => {
    setIsAsideExpanded(!isAsideExpanded);
  };

  const sections = {
    // 일반 설정 그룹
    general: {
      component: <GeneralSetting />,
      title: "홈페이지 기본 설정",
      desc: "홈페이지의 기본 정보와 디자인을 설정할 수 있습니다."
    },
    design: {
      component: <DesignSetting />,
      title: "전체 디자인 설정",
      desc: "홈페이지의 전체적인 디자인을 설정할 수 있습니다."
    },
    menu: {
      component: <MenuSetting />,
      title: "메뉴 디자인 설정",
      desc: "메뉴의 디자인과 구성을 설정할 수 있습니다."
    },
    effect: {
      component: <EffectSetting />,
      title: "기타 설정",
      desc: "홈페이지의 기타 효과와 설정을 관리할 수 있습니다."
    },
    theme: {
      component: <ThemeSetting />,
      title: "테마 설정",
      desc: "홈페이지의 테마를 설정할 수 있습니다."
    },

    // 메인 설정 그룹
    mainLayout: {
      component: <MainLayoutSetting />,
      title: "메인 레이아웃 설정",
      desc: "메인 페이지의 레이아웃을 편집할 수 있습니다."
    },
    freeBoard: {
      component: <FreeBoardSetting />,
      title: "스티커보드 설정",
      desc: "스티커보드의 설정을 관리할 수 있습니다."
    },
    notice: {
      component: <MainNoticeSetting />,
      title: "메인 공지 설정",
      desc: "메인 페이지의 공지사항을 설정할 수 있습니다."
    },
    profile: {
      component: <MainProfileSetting />,
      title: "프로필 설정",
      desc: "사용자 프로필 정보를 설정할 수 있습니다."
    },
    slide: {
      component: <SlideSetting />,
      title: "슬라이드 배너 설정",
      desc: "슬라이드 배너를 설정할 수 있습니다."
    },
    dday: {
      component: <MainDdaySetting />,
      title: "디데이 설정",
      desc: "디데이 기능을 설정할 수 있습니다."
    }
  };

  const renderContent = () => {
    return sections[activeSection]?.component || sections.general.component;
  };

  const getSectionTitle = () => {
    return sections[activeSection]?.title || sections.general.title;
  };

  const getSectionDescription = () => {
    return sections[activeSection]?.desc || sections.general.desc;
  };

  return (
    <AdminRoute>
      <S.Wrapper>
        <S.Container>
          <S.Aside isExpanded={isAsideExpanded} onClick={toggleAside}>
            <S.CategoryWrap isExpanded={isAsideExpanded}>
              <S.CategoryBox>
                <S.Category>홈페이지 설정</S.Category>
                <S.CategoryTitle
                  active={activeSection === "general"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("general");
                  }}
                >
                  홈페이지 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "design"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("design");
                  }}
                >
                  전체 디자인 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "menu"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("menu");
                  }}
                >
                  메뉴 디자인 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "effect"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("effect");
                  }}
                >
                  기타 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "theme"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("theme");
                  }}
                >
                  테마 설정
                </S.CategoryTitle>
              </S.CategoryBox>

              <S.CategoryBox style={{ marginTop: "40px" }}>
                <S.Category>메인 페이지 설정</S.Category>
                <S.CategoryTitle
                  active={activeSection === "mainLayout"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("mainLayout");
                  }}
                >
                  메인 레이아웃 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "freeBoard"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("freeBoard");
                  }}
                >
                  스티커보드 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "notice"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("notice");
                  }}
                >
                  메인 공지 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "profile"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("profile");
                  }}
                >
                  프로필 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "slide"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("slide");
                  }}
                >
                  슬라이드 배너 설정
                </S.CategoryTitle>
                <S.CategoryTitle
                  active={activeSection === "dday"}
                  onClick={e => {
                    e.stopPropagation();
                    handleSectionChange("dday");
                  }}
                >
                  디데이 설정
                </S.CategoryTitle>
              </S.CategoryBox>
            </S.CategoryWrap>
          </S.Aside>
          <S.Content>
            <S.ContentTop>
              <S.ContentTopTitle>{getSectionTitle()}</S.ContentTopTitle>
              <S.ContentTopDesc>{getSectionDescription()}</S.ContentTopDesc>
            </S.ContentTop>
            <S.ContentBottom>
              <S.UnitWrap>{renderContent()}</S.UnitWrap>
            </S.ContentBottom>
          </S.Content>
        </S.Container>
      </S.Wrapper>
    </AdminRoute>
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  ColorPicker,
  message,
  Popconfirm,
  PopconfirmProps,
  Select
} from "antd";
import { WidthProvider, Responsive } from "react-grid-layout";
import * as S from "./style";
import { useTheme } from "@emotion/react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { setCustomLayout } from "../../../../etc/queries/setCustomLayout";
import { useSetting } from "../../../../etc/contexts/settings";
import { ChevronDown, Trash2 } from "lucide-react";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export default function CustomLayout() {
  const theme = useTheme();

  const { main, updateMain } = useSetting();
  const customLayout = main?.customLayout;

  const widgetOptions = [
    { label: "공지", value: "공지" },
    { label: "슬라이드 배너", value: "슬라이드 배너" },
    { label: "텍스트바", value: "텍스트바" },
    { label: "프로필", value: "프로필" },
    { label: "스티커보드", value: "스티커보드" },
    { label: "디데이", value: "디데이" },
    { label: "최신글", value: "최신글" },
    { label: "뮤직플레이어", value: "뮤직플레이어" }
  ];

  const widgetColor = [
    "#FFC2D2",
    "#FFE5CC",
    "#FFF1B4",
    "#E9FAB6",
    "#C9F1FF",
    "#A6BCEB",
    "#D5D4FC",
    "#FFE0DD",
    "#EDF0FF"
  ];

  const [layout, setLayout] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [usedColors, setUsedColors] = useState([]);

  const layoutChannelRef = useRef<BroadcastChannel | null>(null);

  // 반응형 rowHeight 상태 추가
  const [rowHeight, setRowHeight] = useState(25.5);

  // 반응형 rowHeight 계산 함수
  const calculateRowHeight = useCallback(() => {
    // 전체 창 높이에서 고정 요소들의 높이를 제외
    const headerHeight = 200; // 상단 정보 영역
    const buttonHeight = 80; // 하단 버튼 영역
    const padding = 40; // 여백

    const availableHeight =
      window.innerHeight - headerHeight - buttonHeight - padding;
    const maxRows = 12;

    // 최소 높이 20px, 최대 높이 80px로 제한
    const calculatedHeight = Math.max(
      20,
      Math.min(25.5, availableHeight / maxRows)
    );

    setRowHeight(calculatedHeight);
  }, []);

  // 윈도우 리사이즈 이벤트 처리
  useEffect(() => {
    // 초기 계산
    calculateRowHeight();

    // 리사이즈 이벤트 리스너 등록
    const handleResize = () => {
      calculateRowHeight();
    };

    window.addEventListener("resize", handleResize);

    // 정리 함수
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateRowHeight]);

  // Load saved layout and widgets from API when component mounts
  useEffect(() => {
    const loadLayoutData = async () => {
      try {
        if (customLayout) {
          setLayout(customLayout.layout);
          setWidgets(customLayout.widgets);
          setUsedColors(customLayout.usedColors || []);
        }
      } catch (error) {
        message.error("저장된 레이아웃을 불러오는 중 오류가 발생했습니다.");
      }
    };

    loadLayoutData();
  }, []);

  // setup broadcast channel for live updates
  useEffect(() => {
    layoutChannelRef.current = new BroadcastChannel("layoutUpdated");
    return () => {
      layoutChannelRef.current?.close();
    };
  }, []);

  const findAvailablePosition = layout => {
    const occupiedCells = new Set();
    layout.forEach(widget => {
      for (let x = widget.x; x < widget.x + widget.w; x++) {
        for (let y = widget.y; y < widget.y + widget.h; y++) {
          occupiedCells.add(`${x},${y}`);
        }
      }
    });

    for (let y = 0; y <= 7; y++) {
      for (let x = 0; x <= 10; x++) {
        let fits = true;
        for (let dx = 0; dx < 2; dx++) {
          for (let dy = 0; dy < 2; dy++) {
            if (occupiedCells.has(`${x + dx},${y + dy}`)) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }

        if (fits) return { x, y };
      }
    }

    return null;
  };

  const getUniqueColor = () => {
    const availableColors = widgetColor.filter(
      color => !usedColors.includes(color)
    );

    if (availableColors.length === 0) {
      // 모든 색상 사용 시 다시 시작
      setUsedColors([]);
      return widgetColor[0];
    }

    // 랜덤하게 색상 선택
    const randomColor =
      availableColors[Math.floor(Math.random() * availableColors.length)];
    return randomColor;
  };

  const handleAddWidget = () => {
    if (!selectedWidget) return message.warning("추가할 위젯을 선택해주세요!");

    // 이미 추가된 위젯 타입인지 확인
    const isWidgetAlreadyExists = widgets.some(
      widget => widget.type === selectedWidget
    );

    if (isWidgetAlreadyExists) {
      return message.warning(`${selectedWidget} 위젯은 이미 추가되었습니다.`);
    }

    if (layout.length >= 9) {
      return message.warning("최대 9개의 위젯만 추가할 수 있습니다.");
    }

    const availablePosition = findAvailablePosition(layout);

    if (!availablePosition) {
      return message.warning("충분한 공간을 확보 후 추가해주세요.");
    }

    const newWidgetColor = getUniqueColor();
    const newWidgetId = `${selectedWidget}`;
    const newWidget = {
      i: newWidgetId,
      x: availablePosition.x,
      y: availablePosition.y,
      w: 2,
      h: 2,
      maxW: 12,
      maxH: 12
    };

    setLayout(prev => [...prev, newWidget]);
    setWidgets(prev => [
      ...prev,
      {
        id: newWidgetId,
        type: selectedWidget,
        color: newWidgetColor
      }
    ]);
    setUsedColors(prev => [...prev, newWidgetColor]);
  };

  const handleRemoveWidget = widgetId => {
    const removedWidget = widgets.find(widget => widget.id === widgetId);

    setLayout(prev => prev.filter(item => item.i !== widgetId));
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));

    // 제거된 위젯의 색상을 사용 가능한 색상 목록에서 제거
    setUsedColors(prev => prev.filter(color => color !== removedWidget.color));
  };

  const handleLayoutChange = newLayout => {
    setLayout(newLayout);
  };

  const handleColorChange = (widgetId, color) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, color: color.toHexString() }
          : widget
      )
    );
  };

  const handleSaveLayout = async () => {
    try {
      const layoutData = {
        layout,
        widgets,
        usedColors
      };

      await setCustomLayout(layoutData);

      // 상태 업데이트 및 브로드캐스트
      updateMain({ customLayout: layoutData });
      layoutChannelRef.current?.postMessage(layoutData);

      message.success("레이아웃이 성공적으로 저장되었습니다.");
    } catch (error) {
      message.error("레이아웃 저장 중 오류가 발생했습니다.");
    }
  };

  const handleClearLayout = async () => {
    try {
      const emptyLayoutData = {
        layout: [],
        widgets: [],
        usedColors: []
      };

      await setCustomLayout(emptyLayoutData);

      // Reset component state
      setLayout([]);
      setWidgets([]);
      setUsedColors([]);
      setSelectedWidget(null);

      // 상태 업데이트 및 브로드캐스트
      localStorage.setItem(
        "main_custom_layout",
        JSON.stringify(emptyLayoutData)
      );
      updateMain({ customLayout: emptyLayoutData });
      layoutChannelRef.current?.postMessage(emptyLayoutData);

      message.success("레이아웃이 초기화되었습니다.");
    } catch (error) {
      message.error("레이아웃 초기화 중 오류가 발생했습니다.");
    }
  };

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <S.Wrapper>
      <S.InfoWrap>
        <S.InfoTitle>커스텀 레이아웃 편집</S.InfoTitle>
        <S.InfoBox>
          <S.InfoList>위젯을 선택하고 추가하세요.</S.InfoList>
          <S.InfoList>
            드래그로 위치를 변경하고 크기를 조정할 수 있습니다.
          </S.InfoList>
          <S.InfoList>
            충분한 공간이 확보되어야 새로운 위젯을 추가할 수 있습니다.
          </S.InfoList>
          <S.InfoList>
            화면 크기에 따라 위젯 높이가 자동으로 조정됩니다.
          </S.InfoList>
        </S.InfoBox>
      </S.InfoWrap>
      <S.AddBlockWrap>
        <S.AddBlockTitle>위젯 추가</S.AddBlockTitle>
        <S.AddBlockBox>
          <Select
            options={widgetOptions}
            placeholder="위젯 선택"
            style={{ width: 200 }}
            onChange={setSelectedWidget}
            value={selectedWidget}
            suffixIcon={<ChevronDown size={16} />}
          />
          <Button onClick={handleAddWidget}>추가하기</Button>
        </S.AddBlockBox>
      </S.AddBlockWrap>

      <S.Container>
        <S.BlockWrap>
          <ResponsiveReactGridLayout
            className="layout"
            cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
            rowHeight={rowHeight} // 동적으로 계산된 rowHeight 사용
            maxRows={12}
            compactType={null}
            preventCollision={true}
            isDraggable={true}
            isResizable={true}
            onLayoutChange={handleLayoutChange}
          >
            {layout.map(item => {
              const widget = widgets.find(widget => widget.id === item.i);
              return (
                <S.Widget
                  key={item.i}
                  data-grid={item}
                  style={{
                    background: widget?.color || "#f9f9f9"
                  }}
                >
                  {widget?.type || "위젯"}
                </S.Widget>
              );
            })}
          </ResponsiveReactGridLayout>
        </S.BlockWrap>

        <S.WidgetWrap>
          <S.WidgetTitle>추가된 위젯</S.WidgetTitle>
          <S.WidgetBox>
            {widgets.map(widget => (
              <S.WidgetList key={widget.id}>
                <S.WidgetItem>
                  <ColorPicker
                    defaultValue={widget.color}
                    onChange={color => handleColorChange(widget.id, color)}
                  />
                  <S.WidgetName>{widget.type}</S.WidgetName>
                  <Button
                    onClick={() => {
                      handleRemoveWidget(widget.id);
                    }}
                    icon={
                      <Trash2 color={theme.palette.text.textSub} size={16} />
                    }
                  />
                </S.WidgetItem>
              </S.WidgetList>
            ))}
          </S.WidgetBox>
        </S.WidgetWrap>
      </S.Container>

      {/* 현재 rowHeight 값 표시 (개발용 - 필요시 제거) */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1000
        }}
      >
        rowHeight: {Math.round(rowHeight)}px
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: 40
        }}
      >
        <Popconfirm
          title="정말 레이아웃을 초기화할까요?"
          onConfirm={handleClearLayout}
          onCancel={cancel}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button onClick={handleSaveLayout}>저장하기</Button>
      </div>
    </S.Wrapper>
  );
}

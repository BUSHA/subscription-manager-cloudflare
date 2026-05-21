import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #1a1a1a;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const LogoMark = styled.svg`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const WordWhite = styled.span`
  font-size: 1.5rem;
  font-weight: 400;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const WordTeal = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #03DAC6, #01A896);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
`;

export default function Header() {
  return (
    <HeaderContainer>
      <LogoMark viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M388 4H132C61.3075 4 4 61.3075 4 132V388C4 458.692 61.3075 516 132 516H388C458.692 516 516 458.692 516 388V132C516 61.3075 458.692 4 388 4Z" fill="#080808" stroke="#1C1C1C" stroke-width="8"/>
        <path d="M260 400C182.385 400 120 337.615 120 260C120 182.385 182.385 120 260 120C337.615 120 400 182.385 400 260" stroke="url(#g)" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M400 260L368 240L368 280Z" fill="url(#g)"/>
        <rect x="185" y="225" width="150" height="90" rx="14" fill="#121212" stroke="url(#g)" stroke-width="6"/>
        <rect x="208" y="245" width="22" height="16" rx="4" fill="url(#g)" opacity="0.5"/>
        <rect x="208" y="275" width="55" height="5" rx="2.5" fill="url(#g)" opacity="0.3"/>
        <rect x="208" y="288" width="75" height="5" rx="2.5" fill="url(#g)" opacity="0.3"/>
        <defs>
          <linearGradient id="g" x1="4" y1="4" x2="516" y2="516" gradientUnits="userSpaceOnUse">
            <stop stop-color="#03DAC6"/>
            <stop offset="1" stop-color="#01A896"/>
          </linearGradient>
        </defs>
      </LogoMark>
      <TitleGroup>
        <WordWhite>Subscription</WordWhite>
        <WordTeal>Manager</WordTeal>
      </TitleGroup>
    </HeaderContainer>
  );
}

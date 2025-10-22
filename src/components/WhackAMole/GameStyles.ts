import styled from 'styled-components';

export const BattlefieldContainer = styled.section`
  background: url(/images/whackamole/bg.jpg) center / cover no-repeat;
  height: 100%;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const Field = styled.div`
  display: grid;
  flex: 1;
  padding: 2vh 10vw;
  grid-template-columns: 80px 80px 80px;
  gap: 20px 20px;
  justify-content: center;
  align-content: center;

  @media (min-width: 1400px) {
    grid-template-columns: 180px 180px 180px;
    gap: 20px 50px;
    padding: 2vh 10vw;
  }
`;

export const Score = styled.div`
  border: 2px solid white;
  border-radius: 4px;
  font-size: 0.875rem;
  padding: 8px 16px;
  text-align: center;
  width: 90px;
  color: white;
  font-weight: bold;

  @media (min-width: 1400px) {
    font-size: 1.25rem;
    width: 140px;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
`;
